export type Medicine = {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  manufacturer: string;
};

export const medicines: Medicine[] = [
  {
    id: "m1",
    name: "Paracetamol 500mg",
    category: "Fever & Pain",
    price: 30,
    description: "Used for temporary relief from fever and mild pain.",
    manufacturer: "MediCare Pharma",
  },
  {
    id: "m2",
    name: "Cetirizine 10mg",
    category: "Allergy",
    price: 45,
    description: "Used for relief from common allergy symptoms.",
    manufacturer: "MediCare Pharma",
  },
  {
    id: "m3",
    name: "Vitamin C Tablets",
    category: "Vitamin",
    price: 120,
    description: "Vitamin C supplement.",
    manufacturer: "MediCare Pharma",
  },
  {
    id: "m4",
    name: "Calcium Tablets",
    category: "Bone Health",
    price: 150,
    description: "Calcium supplement for bone health.",
    manufacturer: "MediCare Pharma",
  },
];