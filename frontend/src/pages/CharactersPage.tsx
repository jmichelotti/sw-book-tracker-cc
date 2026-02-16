import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCharacterNetwork, listCharacters } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export function CharactersPage() {
  const { data: characters, isLoading } = useQuery({
    queryKey: ["characters"],
    queryFn: listCharacters,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Characters</h1>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="network">Network Graph</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {characters?.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-muted-foreground truncate max-w-md">
                      {c.description || "-"}
                    </TableCell>
                  </TableRow>
                ))}
                {characters?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      No characters yet. Run the scraper to populate data.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="network">
          <NetworkGraphTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NetworkGraphTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["character-network"],
    queryFn: getCharacterNetwork,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  if (isLoading) {
    return <Skeleton className="h-[500px]" />;
  }

  if (!data || data.nodes.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-12">
        No network data available. Characters need book associations to form a network.
      </p>
    );
  }

  return (
    <div ref={containerRef} className="border rounded-lg overflow-hidden" style={{ height: 500 }}>
      <ForceGraphWrapper data={data} />
    </div>
  );
}

function ForceGraphWrapper({ data }: { data: { nodes: { id: number; name: string; val: number }[]; links: { source: number; target: number; value: number }[] } }) {
  // Lazy import to avoid SSR issues and keep bundle smaller
  const { data: ForceGraph } = useQuery({
    queryKey: ["force-graph-module"],
    queryFn: async () => {
      const mod = await import("react-force-graph-2d");
      return mod.default;
    },
    staleTime: Infinity,
  });

  if (!ForceGraph) return <Skeleton className="h-[500px]" />;

  const FG = ForceGraph;

  return (
    <FG
      graphData={data}
      nodeLabel="name"
      nodeVal="val"
      nodeAutoColorBy="id"
      linkWidth={(link: { value?: number }) => Math.sqrt(link.value ?? 1)}
      width={800}
      height={500}
      nodeCanvasObject={(node: { x?: number; y?: number; name?: string; val?: number; color?: string }, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const label = node.name || "";
        const fontSize = Math.max(12 / globalScale, 2);
        ctx.font = `${fontSize}px Sans-Serif`;
        ctx.fillStyle = node.color || "#666";
        ctx.beginPath();
        const r = Math.sqrt(node.val || 1) * 2;
        ctx.arc(node.x || 0, node.y || 0, r, 0, 2 * Math.PI);
        ctx.fill();
        if (globalScale > 1.5) {
          ctx.fillStyle = "#fff";
          ctx.textAlign = "center";
          ctx.fillText(label, node.x || 0, (node.y || 0) + r + fontSize);
        }
      }}
    />
  );
}
