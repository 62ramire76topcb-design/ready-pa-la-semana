import { Meal } from "./types";

export const MEALS: Meal[] = [
  {
    id: "steak-chimichurri",
    name: "Steak con Chimichurri",
    description: "Filete jugoso con salsa chimichurri y vegetales asados",
    calories: 520,
    protein: 42,
    tags: ["protein", "balanced"],
    emoji: "\u{1F969}",
    price: 14.99,
  },
  {
    id: "salmon-lemon",
    name: "Salm\u00f3n al Lim\u00f3n",
    description: "Salm\u00f3n fresco con lim\u00f3n, esp\u00e1rragos y quinoa",
    calories: 480,
    protein: 38,
    tags: ["protein", "balanced", "calorie"],
    emoji: "\u{1F99E}",
    price: 15.99,
  },
  {
    id: "chicken-teriyaki",
    name: "Pollo Teriyaki",
    description: "Pechuga de pollo glaseada con arroz integral y br\u00f3coli",
    calories: 450,
    protein: 40,
    tags: ["protein", "balanced"],
    emoji: "\u{1F357}",
    price: 12.99,
  },
  {
    id: "keto-bowl",
    name: "Bowl Keto de Res",
    description: "Carne de res, aguacate, queso y vegetales bajos en carbos",
    calories: 510,
    protein: 36,
    tags: ["keto", "protein"],
    emoji: "\u{1F957}",
    price: 14.49,
  },
  {
    id: "veggie-buddha",
    name: "Buddha Bowl Veggie",
    description: "Garbanzos, batata, kale, tahini y semillas",
    calories: 420,
    protein: 18,
    tags: ["veggie", "balanced", "calorie"],
    emoji: "\u{1F966}",
    price: 11.99,
  },
  {
    id: "shrimp-garlic",
    name: "Camarones al Ajo",
    description: "Camarones salteados con ajo, zucchini y pasta de calabac\u00edn",
    calories: 390,
    protein: 34,
    tags: ["protein", "keto", "calorie"],
    emoji: "\u{1F990}",
    price: 15.49,
  },
  {
    id: "turkey-meatballs",
    name: "Alb\u00f3ndigas de Pavo",
    description: "Alb\u00f3ndigas de pavo con salsa de tomate y zucchini noodles",
    calories: 430,
    protein: 35,
    tags: ["protein", "calorie", "balanced"],
    emoji: "\u{1F9C6}",
    price: 12.49,
  },
  {
    id: "tofu-stirfry",
    name: "Salteado de Tofu",
    description: "Tofu crujiente con vegetales asi\u00e1ticos y salsa de soya",
    calories: 380,
    protein: 22,
    tags: ["veggie", "calorie"],
    emoji: "\u{1F96C}",
    price: 11.49,
  },
  {
    id: "pork-carnitas",
    name: "Carnitas de Cerdo",
    description: "Cerdo desmechado con arroz de coliflor y frijoles negros",
    calories: 490,
    protein: 33,
    tags: ["protein", "balanced"],
    emoji: "\u{1F953}",
    price: 13.49,
  },
  {
    id: "egg-white-scramble",
    name: "Revuelto de Claras",
    description: "Claras de huevo, espinaca, tomate y aguacate",
    calories: 310,
    protein: 28,
    tags: ["protein", "calorie", "keto"],
    emoji: "\u{1F95A}",
    price: 10.99,
  },
];

export const DAYS_OPTIONS = [
  { id: "1-2", label: "1-2 d\u00edas a la semana", desc: "Ideal para probar", meals: 4 },
  { id: "3", label: "3 d\u00edas a la semana", desc: "El m\u00e1s popular", meals: 6 },
  { id: "weekdays", label: "D\u00edas de semana", desc: "Lunes a viernes", meals: 10 },
  { id: "everyday", label: "Todos los d\u00edas", desc: "M\u00e1ximo comodidad", meals: 14 },
];

export const PREFERENCE_OPTIONS = [
  { id: "protein", label: "Alto en Prote\u00edna", desc: "30g+ de prote\u00edna por comida", emoji: "\u{1F969}" },
  { id: "calorie", label: "Calorie Smart", desc: "Menos de 550 calor\u00edas", emoji: "\u{1F4CA}" },
  { id: "keto", label: "Keto / Bajo en carbos", desc: "15g netos de carbos o menos", emoji: "\u{1F951}" },
  { id: "balanced", label: "Equilibrado", desc: "Variedad y nutrici\u00f3n completa", emoji: "\u{1F957}" },
  { id: "veggie", label: "Vegetariano / Vegano", desc: "Opciones plant-based", emoji: "\u{1F966}" },
];

export const PEOPLE_OPTIONS = [
  { id: "1", label: "1 persona", desc: "Porciones individuales" },
  { id: "2", label: "2 personas", desc: "Ideal para parejas" },
  { id: "3-4", label: "3-4 personas", desc: "Familia peque\u00f1a" },
];

export const PRICES: Record<string, number> = {
  "1-2": 59.99,
  "3": 79.99,
  weekdays: 109.99,
  everyday: 139.99,
};