"""One-time script to merge /Legends character variants into base characters.

For characters with both "Foo" and "Foo/Legends" entries:
  - Move all book_characters links from /Legends to the base character
  - Delete the /Legends character row
  - Handle PK conflicts (both in same book) by keeping the base row

For Legends-only characters (only "Foo/Legends", no "Foo"):
  - Strip "/Legends" from the name

Runs directly against PostgreSQL using asyncpg.
"""

import asyncio
import os

import asyncpg

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://swtracker:swtracker@localhost:5432/swbooktracker",
)


async def main():
    conn = await asyncpg.connect(DATABASE_URL)

    try:
        async with conn.transaction():
            # Find all characters whose name ends with /Legends
            legends = await conn.fetch(
                "SELECT id, name FROM characters WHERE name LIKE '%/Legends'"
            )
            print(f"Found {len(legends)} characters with /Legends suffix")

            merged = 0
            renamed = 0
            links_moved = 0
            links_skipped = 0

            for row in legends:
                legends_id = row["id"]
                legends_name = row["name"]
                base_name = legends_name.removesuffix("/Legends")

                # Check if base character exists
                base = await conn.fetchrow(
                    "SELECT id FROM characters WHERE name = $1", base_name
                )

                if base:
                    base_id = base["id"]

                    # Find book_characters links for the /Legends character
                    legends_links = await conn.fetch(
                        "SELECT book_id, appearance_tag FROM book_characters WHERE character_id = $1",
                        legends_id,
                    )

                    for link in legends_links:
                        book_id = link["book_id"]
                        # Check if base character already has a link to this book
                        existing = await conn.fetchrow(
                            "SELECT 1 FROM book_characters WHERE book_id = $1 AND character_id = $2",
                            book_id,
                            base_id,
                        )
                        if existing:
                            # PK conflict — keep the base row, delete the legends one
                            await conn.execute(
                                "DELETE FROM book_characters WHERE book_id = $1 AND character_id = $2",
                                book_id,
                                legends_id,
                            )
                            links_skipped += 1
                        else:
                            # Move the link to the base character
                            await conn.execute(
                                "UPDATE book_characters SET character_id = $1 WHERE book_id = $2 AND character_id = $3",
                                base_id,
                                book_id,
                                legends_id,
                            )
                            links_moved += 1

                    # Delete the /Legends character row
                    await conn.execute(
                        "DELETE FROM characters WHERE id = $1", legends_id
                    )
                    merged += 1
                else:
                    # Legends-only — just strip the suffix
                    await conn.execute(
                        "UPDATE characters SET name = $1 WHERE id = $2",
                        base_name,
                        legends_id,
                    )
                    renamed += 1

            # Post-merge sanity check: look for any remaining name collisions
            dupes = await conn.fetch(
                """
                SELECT name, COUNT(*) AS cnt
                FROM characters
                GROUP BY name
                HAVING COUNT(*) > 1
                """
            )

            print(f"\nMerge complete:")
            print(f"  Merged (dual-variant):  {merged}")
            print(f"  Renamed (Legends-only): {renamed}")
            print(f"  Links moved:            {links_moved}")
            print(f"  Links skipped (dupes):  {links_skipped}")
            print(f"  Name collisions after:  {len(dupes)}")

            if dupes:
                for d in dupes:
                    print(f"    COLLISION: '{d['name']}' x{d['cnt']}")

    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
