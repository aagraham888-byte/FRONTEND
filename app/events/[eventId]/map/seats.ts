export type Seat = {
  id: string;
  sectionId: string;
  row: string;
  number: number;
  price: number;
  available: boolean;
};

export const mockSeats: Seat[] = [
  { id: "101-A-1", sectionId: "101", row: "A", number: 1, price: 220, available: true },
  { id: "101-A-2", sectionId: "101", row: "A", number: 2, price: 220, available: false },
  { id: "101-A-3", sectionId: "101", row: "A", number: 3, price: 220, available: true },
  { id: "101-B-1", sectionId: "101", row: "B", number: 1, price: 210, available: true },
  { id: "201-C-1", sectionId: "201", row: "C", number: 1, price: 150, available: true },
  { id: "201-C-2", sectionId: "201", row: "C", number: 2, price: 150, available: true }
];
