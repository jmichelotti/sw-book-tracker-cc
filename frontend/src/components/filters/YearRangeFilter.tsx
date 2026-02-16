import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  yearMin: number | undefined;
  yearMax: number | undefined;
  eraMin: string;
  eraMax: string;
  onYearMinChange: (value: number | undefined) => void;
  onYearMaxChange: (value: number | undefined) => void;
  onEraMinChange: (era: string) => void;
  onEraMaxChange: (era: string) => void;
}

export function YearRangeFilter({
  yearMin,
  yearMax,
  eraMin,
  eraMax,
  onYearMinChange,
  onYearMaxChange,
  onEraMinChange,
  onEraMaxChange,
}: Props) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex">
        <Input
          type="number"
          min={0}
          placeholder="From"
          className="w-[80px] rounded-r-none"
          defaultValue={yearMin !== undefined ? Math.abs(yearMin) : ""}
          onChange={(e) => {
            const raw = e.target.value;
            if (!raw) {
              onYearMinChange(undefined);
              return;
            }
            const num = Number(raw);
            onYearMinChange(eraMin === "BBY" ? -num : num);
          }}
        />
        <Select value={eraMin} onValueChange={onEraMinChange}>
          <SelectTrigger className="w-[80px] rounded-l-none border-l-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" sideOffset={4}>
            <SelectItem value="BBY">BBY</SelectItem>
            <SelectItem value="ABY">ABY</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <span className="text-muted-foreground">to</span>
      <div className="flex">
        <Input
          type="number"
          min={0}
          placeholder="To"
          className="w-[80px] rounded-r-none"
          defaultValue={yearMax !== undefined ? Math.abs(yearMax) : ""}
          onChange={(e) => {
            const raw = e.target.value;
            if (!raw) {
              onYearMaxChange(undefined);
              return;
            }
            const num = Number(raw);
            onYearMaxChange(eraMax === "BBY" ? -num : num);
          }}
        />
        <Select value={eraMax} onValueChange={onEraMaxChange}>
          <SelectTrigger className="w-[80px] rounded-l-none border-l-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" sideOffset={4}>
            <SelectItem value="BBY">BBY</SelectItem>
            <SelectItem value="ABY">ABY</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
