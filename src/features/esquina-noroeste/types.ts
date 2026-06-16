export interface NorthwestExercise {
  id: string | number;
  name: string;
  rows: number;
  cols: number;
  costs: number[][];
  supply: number[];
  demand: number[];
  totalSupply: number;
  totalDemand: number;
  isBalanced: boolean;
  namesRows: string[];
  namesCols: string[];
  statement: string | null;
}

export interface NorthwestFrame {
  step: number;
  allocations: (number | null)[][];
  crossedRows: number[];
  crossedCols: number[];
  narrative: string;
  balancedCosts: number[][];
  balancedSupply: number[];
  balancedDemand: number[];
  namesRows: string[];
  namesCols: string[];
  currentCell: { r: number; c: number } | null;
}

export interface NorthwestSolution {
  frames: NorthwestFrame[];
  totalCost: number;
  balancedMatrix: {
    costs: number[][];
    supply: number[];
    demand: number[];
    namesRows: string[];
    namesCols: string[];
  };
}
