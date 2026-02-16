import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SortOption {
  value: string;
  label: string;
}

interface Props {
  orderBy: string;
  orderDir: string;
  onOrderByChange: (value: string) => void;
  onOrderDirChange: (value: string) => void;
  sortOptions: SortOption[];
}

export function SortControls({ orderBy, orderDir, onOrderByChange, onOrderDirChange, sortOptions }: Props) {
  return (
    <>
      <Select value={orderBy} onValueChange={onOrderByChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={orderDir} onValueChange={onOrderDirChange}>
        <SelectTrigger className="w-[100px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="asc">Asc</SelectItem>
          <SelectItem value="desc">Desc</SelectItem>
        </SelectContent>
      </Select>
    </>
  );
}
