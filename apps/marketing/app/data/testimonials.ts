// Testimonials as published on edurit.in. Only keep quotes you have permission to use.
export type Testimonial = {
  quote: string;
  name: string;
  role: string;
};

export const testimonials: Testimonial[] = [
  {
    quote:
      "EduRit transformed how we run Westbrook Academy. Attendance, grades, and fees used to take our admin team all day — now it's done before morning assembly.",
    name: "Dr. Patricia Harris",
    role: "Principal, Westbrook Academy",
  },
  {
    quote:
      "As a teacher managing four classes, the gradebook and assignment tools save me hours every week. Parents actually love getting real-time updates on their children.",
    name: "Mr. James Okonkwo",
    role: "Science Teacher, Grade 9–11",
  },
  {
    quote:
      "I can see my daughter's grades, attendance, and even pay her fees from my phone. It gives me peace of mind and keeps me involved without having to call the school.",
    name: "Mr. Kwame Osei",
    role: "Parent, Westbrook Academy",
  },
];
