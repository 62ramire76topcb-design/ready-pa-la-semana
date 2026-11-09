import { Meal } from "./types";

export const MEALS: Meal[] = [
  { id: "steak-chimichurri", name: "Steak con Chimichurri", description: "Filete jugoso con salsa chimichurri y vegetales asados", calories: 520, protein: 42, tags: ["protein", "balanced"], emoji: "🥩", price: 14.99 },
  { id: "salmon-lemon", name: "Salmon al Limon", description: "Salmon fresco con limon, esparragos y quinoa", calories: 480, protein: 38, tags: ["protein", "balanced", "calorie"], emoji: "🐟", price: 15.99 },
  { id: "chicken-teriyaki", name: "Pollo Teriyaki", description: "Pechuga de pollo glaseada con arroz integral y brocoli", calories: 450, protein: 40, tags: ["protein", "balanced"], emoji: "🍗", price: 12.99 },
  { id: "keto-bowl", name: "Bowl Keto de Res", description: "Carne de res, aguacate, queso y vegetales bajos en carbos", calories: 510, protein: 36, tags: ["keto", "protein"], emoji: "🥗", price: 14.49 },
  { id: "veggie-buddha", name: "Buddha Bowl Veggie", description: "Garbanzos, batata, kale, tahini y semillas", calories: 420, protein: 18, tags: ["veggie", "balanced", "calorie"], emoji: "🥦", price: 11.99 },
  { id: "shrimp-garlic", name: "Camarones al Ajo", description: "Camarones salteados con ajo, zucchini y pasta de calabacin", calories: 390, protein: 34, tags: ["protein", "keto", "calorie"], emoji: "🦐", price: 15.49 },
  { id: "turkey-meatballs", name: "Albondigas de Pavo", description: "Albondigas de pavo con salsa de tomate y zucchini noodles", calories: 430, protein: 35, tags: ["protein", "calorie", "balanced"], emoji: "🍝", price: 12.49 },
  { id: "tofu-stirfry", name: "Salteado de Tofu", description: "Tofu crujiente con vegetales asiaticos y salsa de soya", calories: 380, protein: 22, tags: ["veggie", "calorie"], emoji: "🥬", price: 11.49 },
  { id: "pork-carnitas", name: "Carnitas de Cerdo", description: "Cerdo desmechado con arroz de coliflor y frijoles negros", calories: 490, protein: 33, tags: ["protein", "balanced"], emoji: "🍖", price: 13.49 },
  { id: "egg-white-scramble", name: "Revuelto de Claras", description: "Claras de huevo, espinaca, tomate y aguacate", calories: 310, protein: 28, tags: ["protein", "calorie", "keto"], emoji: "🍳", price: 10.99 },
  { id: "beef-bourguignon", name: "Res Bourguignon", description: "Estofado de res con vino tinto, zanahoria y pure de coliflor", calories: 540, protein: 38, tags: ["protein", "balanced"], emoji: "🍲", price: 15.49 },
  { id: "cod-mediterranean", name: "Bacalao Mediterraneo", description: "Bacalao con tomate, aceitunas, alcaparras y hierbas", calories: 410, protein: 36, tags: ["protein", "calorie", "balanced"], emoji: "🐟", price: 14.99 },
  { id: "chicken-pesto", name: "Pollo al Pesto", description: "Pechuga con pesto de albahaca, tomates cherry y quinoa", calories: 460, protein: 39, tags: ["protein", "balanced"], emoji: "🍗", price: 13.49 },
  { id: "cauliflower-curry", name: "Curry de Coliflor", description: "Coliflor, garbanzos y leche de coco con especias indias", calories: 390, protein: 14, tags: ["veggie", "calorie"], emoji: "🍛", price: 11.99 },
  { id: "steak-fajita", name: "Fajita Bowl de Res", description: "Tiras de res, pimientos, cebolla y guacamole", calories: 500, protein: 40, tags: ["protein", "keto"], emoji: "🌮", price: 14.49 },
  { id: "salmon-avocado", name: "Salmon con Aguacate", description: "Salmon a la plancha, aguacate, edamame y arroz integral", calories: 490, protein: 37, tags: ["protein", "balanced"], emoji: "🥑", price: 15.99 },
  { id: "turkey-chili", name: "Chili de Pavo", description: "Chili con pavo molido, frijoles y vegetales", calories: 420, protein: 34, tags: ["protein", "calorie", "balanced"], emoji: "🌶️", price: 12.49 },
  { id: "zucchini-lasagna", name: "Lasagna de Zucchini", description: "Capas de zucchini, ricotta, carne magra y salsa", calories: 440, protein: 32, tags: ["protein", "keto", "balanced"], emoji: "🧀", price: 13.99 },
  { id: "quinoa-power", name: "Power Bowl de Quinoa", description: "Quinoa, pollo a la plancha, kale y aderezo de limon", calories: 430, protein: 35, tags: ["protein", "calorie", "balanced"], emoji: "🥗", price: 12.99 },
  { id: "mushroom-risotto", name: "Risotto de Hongos", description: "Arroz cremoso con hongos silvestres y parmesano (opcion veggie)", calories: 470, protein: 16, tags: ["veggie", "balanced"], emoji: "🍄", price: 12.49 },
];

export const DAYS_OPTIONS = [
  { id: "1-2", label: "1-2 dias a la semana", desc: "Ideal para probar", meals: 4 },
  { id: "3", label: "3 dias a la semana", desc: "El mas popular", meals: 6 },
  { id: "weekdays", label: "Dias de semana", desc: "Lunes a viernes", meals: 10 },
  { id: "everyday", label: "Todos los dias", desc: "Maximo comodidad", meals: 14 },
];

export const PREFERENCE_OPTIONS = [
  { id: "protein", label: "Alto en Proteina", desc: "30g+ de proteina por comida", emoji: "🥩" },
  { id: "calorie", label: "Calorie Smart", desc: "Menos de 550 calorias", emoji: "📊" },
  { id: "keto", label: "Keto / Bajo en carbos", desc: "15g netos de carbos o menos", emoji: "🥑" },
  { id: "balanced", label: "Equilibrado", desc: "Variedad y nutricion completa", emoji: "🥗" },
  { id: "veggie", label: "Vegetariano / Vegano", desc: "Opciones plant-based", emoji: "🥦" },
];

export const PEOPLE_OPTIONS = [
  { id: "1", label: "1 persona", desc: "Porciones individuales" },
  { id: "2", label: "2 personas", desc: "Ideal para parejas" },
  { id: "3-4", label: "3-4 personas", desc: "Familia pequena" },
];

export const PRICES: Record<string, number> = {
  "1-2": 59.99,
  "3": 79.99,
  weekdays: 109.99,
  everyday: 139.99,
};

export function generateOrderNumber(): string {
  const d = new Date();
  const date =
    d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RPS-${date}-${rand}`;
}
