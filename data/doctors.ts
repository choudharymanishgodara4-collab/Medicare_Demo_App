export type Doctor = {
  id: string;
  name: string;
  specialization: string;
  city: string;
  experience: number;
  rating: number;
  category: string;
};

export const doctors: Doctor[] = [
  {
    id: "1",
    name: "Dr. Raj Sharma",
    specialization: "Eye Specialist",
    city: "Ganganagar",
    experience: 12,
    rating: 4.8,
    category: "Eye",
  },
  {
    id: "2",
    name: "Dr. Priya Verma",
    specialization: "Bone Specialist",
    city: "Ganganagar",
    experience: 10,
    rating: 4.7,
    category: "Bone",
  },
  {
    id: "3",
    name: "Dr. Amit Kumar",
    specialization: "ENT Specialist",
    city: "Ganganagar",
    experience: 8,
    rating: 4.6,
    category: "ENT",
  },
  {
    id: "4",
    name: "Dr. Neha Gupta",
    specialization: "Skin Specialist",
    city: "Ganganagar",
    experience: 9,
    rating: 4.9,
    category: "Skin",
  },
];