import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Settings2, RotateCcw, Search, X, ChefHat, Edit2, BookOpen } from "lucide-react";

interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

interface UnitInfo {
  unitLabel: string;
  gramsPerUnit: number;
}

interface LogEntry {
  id: string;
  food: FoodItem;
  grams: number;
}

interface MacroGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// Map of food names to their unit-based serving info (Jain-friendly)
const UNIT_MAP: Record<string, UnitInfo> = {
  "Roti Wheat": { unitLabel: "roti", gramsPerUnit: 40 },
  "Roti Jowar": { unitLabel: "roti", gramsPerUnit: 40 },
  "Roti Bajra": { unitLabel: "roti", gramsPerUnit: 40 },
  "Paratha Plain": { unitLabel: "paratha", gramsPerUnit: 60 },
  "Methi Paratha": { unitLabel: "paratha", gramsPerUnit: 60 },
  "Thepla": { unitLabel: "thepla", gramsPerUnit: 40 },
  "Bhakri Jowar": { unitLabel: "bhakri", gramsPerUnit: 40 },
  "Bhakri Bajra": { unitLabel: "bhakri", gramsPerUnit: 40 },
  "Naan": { unitLabel: "naan", gramsPerUnit: 90 },
  "Puri": { unitLabel: "puri", gramsPerUnit: 30 },
  "Idli": { unitLabel: "idli", gramsPerUnit: 40 },
  "Dosa Plain": { unitLabel: "dosa", gramsPerUnit: 70 },
  "Uttapam": { unitLabel: "uttapam", gramsPerUnit: 100 },
  "Medu Vada": { unitLabel: "vada", gramsPerUnit: 50 },
  "Sabudana Vada": { unitLabel: "piece", gramsPerUnit: 50 },
  "Rava Idli": { unitLabel: "piece", gramsPerUnit: 40 },
  "Besan Chilla": { unitLabel: "chilla", gramsPerUnit: 80 },
  "Moong Dal Chilla": { unitLabel: "chilla", gramsPerUnit: 80 },
  "Dhokla": { unitLabel: "piece", gramsPerUnit: 30 },
  "Methi Muthiya Steamed": { unitLabel: "piece", gramsPerUnit: 30 },
  "Methi Muthiya Fried": { unitLabel: "piece", gramsPerUnit: 30 },
  "Patra": { unitLabel: "piece", gramsPerUnit: 30 },
  "Sukhdi": { unitLabel: "piece", gramsPerUnit: 40 },
  "Kachori": { unitLabel: "piece", gramsPerUnit: 50 },
  "Khakhra Plain": { unitLabel: "piece", gramsPerUnit: 15 },
  "Khakhra Methi": { unitLabel: "piece", gramsPerUnit: 15 },
  "Gulab Jamun": { unitLabel: "piece", gramsPerUnit: 50 },
  "Ladoo Besan": { unitLabel: "ladoo", gramsPerUnit: 40 },
  "Ladoo Motichur": { unitLabel: "ladoo", gramsPerUnit: 35 },
  "Barfi Milk": { unitLabel: "piece", gramsPerUnit: 30 },
  "Chikki Peanut": { unitLabel: "piece", gramsPerUnit: 30 },
  "Chikki Sesame": { unitLabel: "piece", gramsPerUnit: 30 },
  "Puran Poli": { unitLabel: "piece", gramsPerUnit: 80 },
  "Bread White": { unitLabel: "slice", gramsPerUnit: 30 },
  "Bread Brown": { unitLabel: "slice", gramsPerUnit: 30 },
  "Bread Multigrain": { unitLabel: "slice", gramsPerUnit: 30 },
  "Cheese Slice": { unitLabel: "slice", gramsPerUnit: 25 },
  "Chocolate Dark 70%": { unitLabel: "piece", gramsPerUnit: 25 },
  "Chocolate Milk": { unitLabel: "piece", gramsPerUnit: 25 },
  "Chocolate White": { unitLabel: "piece", gramsPerUnit: 25 },
  "Ice Cream Vanilla": { unitLabel: "scoop", gramsPerUnit: 60 },
  "Kulfi": { unitLabel: "piece", gramsPerUnit: 60 },
  "Whey Protein Shake": { unitLabel: "scoop", gramsPerUnit: 30 },
  "Banana": { unitLabel: "banana", gramsPerUnit: 120 },
  "Apple": { unitLabel: "apple", gramsPerUnit: 180 },
  "Orange": { unitLabel: "orange", gramsPerUnit: 150 },
  "Guava": { unitLabel: "guava", gramsPerUnit: 150 },
  "Almond": { unitLabel: "almond", gramsPerUnit: 1.2 },
  "Cashew": { unitLabel: "cashew", gramsPerUnit: 3 },
  "Walnut": { unitLabel: "half", gramsPerUnit: 4 },
  "Dates Dried": { unitLabel: "date", gramsPerUnit: 24 },
  "Milk Full Fat": { unitLabel: "glass", gramsPerUnit: 250 },
  "Milk Toned": { unitLabel: "glass", gramsPerUnit: 250 },
  "Lassi Sweet": { unitLabel: "glass", gramsPerUnit: 250 },
  "Lassi Salted": { unitLabel: "glass", gramsPerUnit: 250 },
  "Buttermilk Chaas": { unitLabel: "glass", gramsPerUnit: 200 },
  "Dal Tadka": { unitLabel: "katori", gramsPerUnit: 150 },
  "Dal Makhani": { unitLabel: "katori", gramsPerUnit: 150 },
  "Chana Dal Cooked": { unitLabel: "katori", gramsPerUnit: 150 },
  "Moong Dal Cooked": { unitLabel: "katori", gramsPerUnit: 150 },
  "Masoor Dal Cooked": { unitLabel: "katori", gramsPerUnit: 150 },
  "Rajma Cooked": { unitLabel: "katori", gramsPerUnit: 150 },
  "Chole Cooked": { unitLabel: "katori", gramsPerUnit: 150 },
  "Gujarati Kadhi": { unitLabel: "katori", gramsPerUnit: 150 },
  "Rajasthani Kadhi": { unitLabel: "katori", gramsPerUnit: 150 },
  "Palak Paneer": { unitLabel: "katori", gramsPerUnit: 100 },
  "Paneer Butter Masala": { unitLabel: "katori", gramsPerUnit: 100 },
  "Matar Paneer": { unitLabel: "katori", gramsPerUnit: 100 },
  "Paneer Bhurji": { unitLabel: "katori", gramsPerUnit: 100 },
  "Bhindi Sabzi": { unitLabel: "katori", gramsPerUnit: 100 },
  "Tindora Sabzi": { unitLabel: "katori", gramsPerUnit: 100 },
  "Dudhi Sabzi": { unitLabel: "katori", gramsPerUnit: 100 },
  "Ringan No Olo": { unitLabel: "katori", gramsPerUnit: 100 },
  "Undhiyu": { unitLabel: "katori", gramsPerUnit: 100 },
  "Sev Tameta": { unitLabel: "katori", gramsPerUnit: 100 },
  "Gatte ki Sabzi": { unitLabel: "katori", gramsPerUnit: 100 },
  "Sambhar": { unitLabel: "katori", gramsPerUnit: 150 },
  "Rice White Cooked": { unitLabel: "katori", gramsPerUnit: 150 },
  "Rice Brown Cooked": { unitLabel: "katori", gramsPerUnit: 150 },
  "Jeera Rice": { unitLabel: "katori", gramsPerUnit: 150 },
  "Khichdi": { unitLabel: "katori", gramsPerUnit: 200 },
  "Curd Full Fat": { unitLabel: "katori", gramsPerUnit: 100 },
  "Curd Low Fat": { unitLabel: "katori", gramsPerUnit: 100 },
  "Ghee": { unitLabel: "tbsp", gramsPerUnit: 15 },
  "Butter": { unitLabel: "tbsp", gramsPerUnit: 15 },
  "Peanut Butter": { unitLabel: "tbsp", gramsPerUnit: 16 },
  "Peanuts Roasted": { unitLabel: "handful", gramsPerUnit: 28 },
  "Roasted Makhana": { unitLabel: "handful", gramsPerUnit: 30 },
  "Masala Chai With Milk": { unitLabel: "cup", gramsPerUnit: 150 },
  "Coffee With Milk": { unitLabel: "cup", gramsPerUnit: 150 },
  "Horlicks": { unitLabel: "cup", gramsPerUnit: 200 },
  "Bournvita": { unitLabel: "cup", gramsPerUnit: 200 },
  "Jalebi": { unitLabel: "piece", gramsPerUnit: 30 },
};

const FOODS: FoodItem[] = [
  // ===== BREAKFAST =====
  { name: "Vermicelli Upma", calories: 130, protein: 3, carbs: 27, fat: 0.5, fiber: 1 },
  { name: "Poha", calories: 130, protein: 3, carbs: 28, fat: 0.5, fiber: 1.2 },
  { name: "Sabudana Khichdi", calories: 200, protein: 2, carbs: 42, fat: 3, fiber: 0.5 },
  { name: "Oats Cooked", calories: 71, protein: 2.5, carbs: 12, fat: 1.5, fiber: 1.7 },
  { name: "Corn Flakes", calories: 367, protein: 7, carbs: 83, fat: 0.7, fiber: 3 },
  { name: "Muesli", calories: 370, protein: 10, carbs: 66, fat: 6, fiber: 8 },
  { name: "Bread White", calories: 267, protein: 8, carbs: 50, fat: 3.3, fiber: 2.7 },
  { name: "Bread Brown", calories: 233, protein: 10, carbs: 43, fat: 3.3, fiber: 7 },
  { name: "Bread Multigrain", calories: 250, protein: 12, carbs: 43, fat: 4, fiber: 6 },
  { name: "Idli", calories: 98, protein: 5, carbs: 20, fat: 0.5, fiber: 1.5 },
  { name: "Dosa Plain", calories: 171, protein: 4.3, carbs: 29, fat: 4.3, fiber: 1 },
  { name: "Uttapam", calories: 150, protein: 4, carbs: 25, fat: 4, fiber: 1.5 },
  { name: "Medu Vada", calories: 200, protein: 8, carbs: 28, fat: 8, fiber: 3 },
  { name: "Sabudana Vada", calories: 300, protein: 1, carbs: 40, fat: 12, fiber: 0.5 },
  { name: "Rava Idli", calories: 200, protein: 4, carbs: 35, fat: 5, fiber: 1 },
  { name: "Besan Chilla", calories: 175, protein: 8.75, carbs: 22.5, fat: 5, fiber: 3 },
  { name: "Moong Dal Chilla", calories: 163, protein: 10, carbs: 20, fat: 3.75, fiber: 3 },

  // ===== ROTIS & BREADS =====
  { name: "Paratha Plain", calories: 300, protein: 6.7, carbs: 47, fat: 10, fiber: 3.5 },
  { name: "Methi Paratha", calories: 300, protein: 8.3, carbs: 47, fat: 8.3, fiber: 4 },
  { name: "Thepla", calories: 325, protein: 7.5, carbs: 50, fat: 10, fiber: 4 },
  { name: "Bhakri Jowar", calories: 300, protein: 7.5, carbs: 62.5, fat: 2.5, fiber: 5 },
  { name: "Bhakri Bajra", calories: 313, protein: 8.75, carbs: 60, fat: 3.75, fiber: 6 },
  { name: "Roti Wheat", calories: 300, protein: 8.75, carbs: 55, fat: 5, fiber: 4 },
  { name: "Roti Jowar", calories: 288, protein: 7.5, carbs: 57.5, fat: 2.5, fiber: 5 },
  { name: "Roti Bajra", calories: 295, protein: 8.75, carbs: 55, fat: 3.75, fiber: 6 },
  { name: "Naan", calories: 300, protein: 8.9, carbs: 50, fat: 6.7, fiber: 2 },
  { name: "Puri", calories: 367, protein: 6.7, carbs: 47, fat: 16.7, fiber: 2.5 },

  // ===== GUJARATI SNACKS =====
  { name: "Dhokla", calories: 167, protein: 6.7, carbs: 26.7, fat: 3.3, fiber: 1.5 },
  { name: "Khandvi", calories: 180, protein: 7, carbs: 22, fat: 7, fiber: 1 },
  { name: "Fafda", calories: 450, protein: 10, carbs: 55, fat: 22, fiber: 3 },
  { name: "Jalebi", calories: 360, protein: 2, carbs: 65, fat: 10, fiber: 0.5 },
  { name: "Gathiya", calories: 430, protein: 11, carbs: 52, fat: 20, fiber: 3 },
  { name: "Sev Plain", calories: 440, protein: 12, carbs: 58, fat: 19, fiber: 4 },
  { name: "Papdi", calories: 420, protein: 9, carbs: 56, fat: 18, fiber: 2 },
  { name: "Methi Muthiya Steamed", calories: 217, protein: 8.3, carbs: 33.3, fat: 5, fiber: 3 },
  { name: "Methi Muthiya Fried", calories: 300, protein: 8.3, carbs: 33.3, fat: 15, fiber: 3 },
  { name: "Handvo", calories: 180, protein: 7, carbs: 26, fat: 5, fiber: 2.5 },
  { name: "Patra", calories: 233, protein: 6.7, carbs: 36.7, fat: 6.7, fiber: 3 },
  { name: "Khakhra Plain", calories: 400, protein: 13.3, carbs: 66.7, fat: 10, fiber: 5 },
  { name: "Khakhra Methi", calories: 413, protein: 13.3, carbs: 66.7, fat: 12, fiber: 5 },
  { name: "Chivda", calories: 400, protein: 10, carbs: 55, fat: 16, fiber: 3 },
  { name: "Chakli", calories: 450, protein: 8, carbs: 60, fat: 20, fiber: 2 },

  // ===== GUJARATI & RAJASTHANI SWEETS =====
  { name: "Sukhdi", calories: 500, protein: 7.5, carbs: 70, fat: 22.5, fiber: 1 },
  { name: "Mohanthal", calories: 450, protein: 8, carbs: 60, fat: 20, fiber: 2 },
  { name: "Churma", calories: 420, protein: 7, carbs: 62, fat: 16, fiber: 2 },
  { name: "Puran Poli", calories: 313, protein: 7.5, carbs: 56.3, fat: 7.5, fiber: 3 },
  { name: "Shrikhand", calories: 190, protein: 7, carbs: 28, fat: 5, fiber: 0 },
  { name: "Basundi", calories: 180, protein: 6, carbs: 24, fat: 7, fiber: 0 },
  { name: "Shreekhand with Fruit", calories: 210, protein: 6, carbs: 32, fat: 6, fiber: 0.5 },

  // ===== RAJASTHANI SPECIALTIES =====
  { name: "Dal Bati", calories: 320, protein: 8, carbs: 48, fat: 11, fiber: 3 },
  { name: "Dal Baati Churma", calories: 380, protein: 9, carbs: 55, fat: 14, fiber: 3 },
  { name: "Gatte ki Sabzi", calories: 180, protein: 7, carbs: 20, fat: 8, fiber: 2 },
  { name: "Ker Sangri", calories: 90, protein: 4, carbs: 14, fat: 2, fiber: 4 },
  { name: "Bajre ki Khichdi", calories: 140, protein: 4, carbs: 24, fat: 3, fiber: 3 },
  { name: "Rajasthani Kadhi", calories: 95, protein: 4, carbs: 9, fat: 4.5, fiber: 0.5 },

  // ===== DALS & LEGUMES =====
  { name: "Gujarati Kadhi", calories: 80, protein: 3, carbs: 10, fat: 3, fiber: 0.5 },
  { name: "Dal Tadka", calories: 100, protein: 6, carbs: 14, fat: 2.5, fiber: 4 },
  { name: "Dal Makhani", calories: 150, protein: 7, carbs: 16, fat: 6, fiber: 5 },
  { name: "Chana Dal Cooked", calories: 164, protein: 9, carbs: 27, fat: 2.5, fiber: 5 },
  { name: "Moong Dal Cooked", calories: 105, protein: 7, carbs: 19, fat: 0.5, fiber: 4.5 },
  { name: "Masoor Dal Cooked", calories: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 4 },
  { name: "Rajma Cooked", calories: 127, protein: 9, carbs: 22, fat: 0.5, fiber: 6.4 },
  { name: "Chole Cooked", calories: 164, protein: 9, carbs: 27, fat: 2.5, fiber: 7.6 },
  { name: "Soyabean Cooked", calories: 173, protein: 17, carbs: 10, fat: 9, fiber: 6 },
  { name: "Tofu", calories: 76, protein: 8, carbs: 2, fat: 4.5, fiber: 0.3 },
  { name: "Sprouts Mixed", calories: 60, protein: 4, carbs: 9, fat: 0.5, fiber: 2.5 },
  { name: "Moong Sprouts", calories: 30, protein: 3, carbs: 5, fat: 0.2, fiber: 1.8 },

  // ===== PANEER DISHES =====
  { name: "Paneer", calories: 265, protein: 18, carbs: 1.2, fat: 20, fiber: 0 },
  { name: "Palak Paneer", calories: 160, protein: 7, carbs: 7, fat: 12, fiber: 2 },
  { name: "Paneer Butter Masala", calories: 200, protein: 8, carbs: 8, fat: 15, fiber: 1.5 },
  { name: "Paneer Bhurji", calories: 180, protein: 11, carbs: 4, fat: 13, fiber: 0.5 },
  { name: "Matar Paneer", calories: 170, protein: 8, carbs: 10, fat: 11, fiber: 3 },

  // ===== SABZIS (Jain-friendly — no root vegetables) =====
  { name: "Bhindi Sabzi", calories: 80, protein: 2, carbs: 9, fat: 4, fiber: 3 },
  { name: "Tindora Sabzi", calories: 70, protein: 2, carbs: 10, fat: 2.5, fiber: 2 },
  { name: "Dudhi Sabzi", calories: 55, protein: 1.5, carbs: 8, fat: 1.5, fiber: 1.5 },
  { name: "Ringan No Olo", calories: 85, protein: 2, carbs: 10, fat: 4, fiber: 3 },
  { name: "Undhiyu", calories: 180, protein: 5, carbs: 22, fat: 8, fiber: 4 },
  { name: "Sev Tameta", calories: 130, protein: 3, carbs: 14, fat: 7, fiber: 2 },
  { name: "Sambhar", calories: 60, protein: 3, carbs: 8, fat: 1.5, fiber: 2.5 },
  { name: "Pav Bhaji", calories: 150, protein: 4, carbs: 22, fat: 5, fiber: 3 },

  // ===== RICE & GRAINS =====
  { name: "Rice White Cooked", calories: 130, protein: 2.5, carbs: 28, fat: 0.3, fiber: 0.4 },
  { name: "Rice Brown Cooked", calories: 120, protein: 2.5, carbs: 25, fat: 1, fiber: 1.8 },
  { name: "Jeera Rice", calories: 150, protein: 2.5, carbs: 28, fat: 3, fiber: 0.5 },
  { name: "Khichdi", calories: 130, protein: 5, carbs: 22, fat: 2.5, fiber: 2 },

  // ===== CHAAT & STREET FOOD (Jain-friendly) =====
  { name: "Kachori", calories: 340, protein: 8, carbs: 40, fat: 16, fiber: 3 },
  { name: "Bhel Puri", calories: 150, protein: 4, carbs: 28, fat: 3, fiber: 2.5 },
  { name: "Roasted Chana", calories: 364, protein: 20, carbs: 58, fat: 5, fiber: 12 },
  { name: "Roasted Makhana", calories: 347, protein: 9, carbs: 76, fat: 0.5, fiber: 14.5 },
  { name: "Peanuts Roasted", calories: 585, protein: 24, carbs: 21, fat: 49, fiber: 8.5 },
  { name: "Chikki Peanut", calories: 483, protein: 13.3, carbs: 60, fat: 23.3, fiber: 3 },
  { name: "Chikki Sesame", calories: 500, protein: 13.3, carbs: 56.7, fat: 26.7, fiber: 4 },

  // ===== DAIRY =====
  { name: "Milk Full Fat", calories: 61, protein: 3.2, carbs: 4.7, fat: 3.3, fiber: 0 },
  { name: "Milk Toned", calories: 45, protein: 3.5, carbs: 4.7, fat: 1.5, fiber: 0 },
  { name: "Curd Full Fat", calories: 60, protein: 3.5, carbs: 3.5, fat: 3.2, fiber: 0 },
  { name: "Curd Low Fat", calories: 35, protein: 4, carbs: 3.5, fat: 0.5, fiber: 0 },
  { name: "Buttermilk Chaas", calories: 20, protein: 1.5, carbs: 2.5, fat: 0.3, fiber: 0 },
  { name: "Lassi Sweet", calories: 80, protein: 3, carbs: 12, fat: 2.5, fiber: 0 },
  { name: "Lassi Salted", calories: 45, protein: 3, carbs: 4, fat: 1.5, fiber: 0 },
  { name: "Cheese Slice", calories: 320, protein: 20, carbs: 4, fat: 24, fiber: 0 },
  { name: "Ghee", calories: 900, protein: 0, carbs: 0, fat: 100, fiber: 0 },
  { name: "Butter", calories: 717, protein: 0.8, carbs: 0.1, fat: 81, fiber: 0 },
  { name: "Whey Protein Shake", calories: 367, protein: 80, carbs: 10, fat: 3.3, fiber: 0 },

  // ===== INDIAN SWEETS =====
  { name: "Gulab Jamun", calories: 300, protein: 6, carbs: 50, fat: 10, fiber: 0.3 },
  { name: "Ladoo Besan", calories: 438, protein: 10, carbs: 55, fat: 20, fiber: 3 },
  { name: "Ladoo Motichur", calories: 429, protein: 5.7, carbs: 62.9, fat: 17.1, fiber: 0.5 },
  { name: "Barfi Milk", calories: 400, protein: 10, carbs: 53.3, fat: 16.7, fiber: 0.5 },
  { name: "Halwa Sooji", calories: 250, protein: 4, carbs: 38, fat: 9, fiber: 0.5 },
  { name: "Kheer", calories: 150, protein: 4, carbs: 22, fat: 5, fiber: 0.3 },
  { name: "Rabdi", calories: 200, protein: 6, carbs: 26, fat: 8, fiber: 0 },
  { name: "Kulfi", calories: 233, protein: 6.7, carbs: 30, fat: 10, fiber: 0 },

  // ===== CHOCOLATES & ICE CREAM =====
  { name: "Chocolate Dark 70%", calories: 540, protein: 8, carbs: 52, fat: 36, fiber: 7 },
  { name: "Chocolate Milk", calories: 520, protein: 8, carbs: 60, fat: 28, fiber: 3 },
  { name: "Chocolate White", calories: 540, protein: 8, carbs: 64, fat: 32, fiber: 0 },
  { name: "Ice Cream Vanilla", calories: 217, protein: 3.3, carbs: 26.7, fat: 11.7, fiber: 0 },

  // ===== FRUITS =====
  { name: "Mango Alphonso", calories: 60, protein: 0.8, carbs: 15, fat: 0.4, fiber: 1.6 },
  { name: "Chikoo Sapota", calories: 83, protein: 0.4, carbs: 20, fat: 1.1, fiber: 5.3 },
  { name: "Custard Apple", calories: 75, protein: 1.7, carbs: 19, fat: 0.4, fiber: 3 },
  { name: "Jamun", calories: 62, protein: 0.7, carbs: 14, fat: 0.3, fiber: 0.6 },
  { name: "Amla", calories: 44, protein: 0.9, carbs: 10, fat: 0.6, fiber: 3.4 },
  { name: "Coconut Fresh", calories: 354, protein: 3.3, carbs: 15, fat: 33, fiber: 9 },
  { name: "Coconut Water", calories: 19, protein: 0.7, carbs: 4, fat: 0.2, fiber: 1 },
  { name: "Apple", calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4 },
  { name: "Banana", calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6 },
  { name: "Orange", calories: 47, protein: 0.9, carbs: 12, fat: 0.1, fiber: 2.4 },
  { name: "Papaya", calories: 43, protein: 0.5, carbs: 11, fat: 0.3, fiber: 1.7 },
  { name: "Grapes", calories: 69, protein: 0.7, carbs: 18, fat: 0.2, fiber: 0.9 },
  { name: "Watermelon", calories: 30, protein: 0.6, carbs: 7.5, fat: 0.2, fiber: 0.4 },
  { name: "Pomegranate", calories: 83, protein: 1.7, carbs: 19, fat: 1.2, fiber: 4 },
  { name: "Guava", calories: 68, protein: 2.6, carbs: 14, fat: 1, fiber: 5.4 },
  { name: "Pineapple", calories: 50, protein: 0.5, carbs: 13, fat: 0.1, fiber: 1.4 },
  { name: "Strawberries", calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3, fiber: 2 },
  { name: "Kiwi", calories: 61, protein: 1.1, carbs: 15, fat: 0.5, fiber: 3 },

  // ===== DRY FRUITS & NUTS =====
  { name: "Almonds", calories: 579, protein: 21, carbs: 22, fat: 50, fiber: 12.5 },
  { name: "Cashews", calories: 553, protein: 18, carbs: 30, fat: 44, fiber: 3.3 },
  { name: "Walnuts", calories: 654, protein: 15, carbs: 14, fat: 65, fiber: 6.7 },
  { name: "Pistachios", calories: 560, protein: 20, carbs: 28, fat: 45, fiber: 10 },
  { name: "Raisins", calories: 299, protein: 3.1, carbs: 79, fat: 0.5, fiber: 3.7 },
  { name: "Dates Dried", calories: 282, protein: 2.5, carbs: 75, fat: 0.4, fiber: 8 },
  { name: "Anjeer Dried", calories: 249, protein: 3.3, carbs: 64, fat: 0.9, fiber: 9.8 },
  { name: "Flax Seeds", calories: 534, protein: 18, carbs: 29, fat: 42, fiber: 27 },
  { name: "Chia Seeds", calories: 486, protein: 17, carbs: 42, fat: 31, fiber: 34 },
  { name: "Sesame Seeds", calories: 573, protein: 18, carbs: 23, fat: 50, fiber: 12 },
  { name: "Pumpkin Seeds", calories: 559, protein: 30, carbs: 11, fat: 49, fiber: 6 },
  { name: "Peanut Butter", calories: 588, protein: 25, carbs: 20, fat: 50, fiber: 6 },

  // ===== BEVERAGES =====
  { name: "Masala Chai With Milk", calories: 40, protein: 1.5, carbs: 5, fat: 1.5, fiber: 0 },
  { name: "Black Tea No Sugar", calories: 2, protein: 0, carbs: 0.5, fat: 0, fiber: 0 },
  { name: "Black Coffee No Sugar", calories: 2, protein: 0.3, carbs: 0, fat: 0, fiber: 0 },
  { name: "Coffee With Milk", calories: 35, protein: 1.5, carbs: 4, fat: 1.5, fiber: 0 },
  { name: "Nimbu Pani", calories: 25, protein: 0.1, carbs: 6, fat: 0, fiber: 0 },
  { name: "Aam Panna", calories: 60, protein: 0.3, carbs: 15, fat: 0.1, fiber: 0.5 },
  { name: "Thandai", calories: 120, protein: 4, carbs: 16, fat: 4.5, fiber: 1 },
  { name: "Horlicks", calories: 75, protein: 3, carbs: 12, fat: 1.5, fiber: 0 },
  { name: "Bournvita", calories: 80, protein: 3, carbs: 13, fat: 1.8, fiber: 0 },
  { name: "Badam Milk", calories: 110, protein: 5, carbs: 14, fat: 4, fiber: 0.5 },
  { name: "Turmeric Milk", calories: 70, protein: 3.5, carbs: 7, fat: 3.5, fiber: 0 },
  { name: "Green Tea", calories: 1, protein: 0, carbs: 0, fat: 0, fiber: 0 },

  // ===== MISCELLANEOUS =====
  { name: "Honey", calories: 304, protein: 0.3, carbs: 82, fat: 0, fiber: 0 },
  { name: "Jaggery", calories: 383, protein: 0.4, carbs: 98, fat: 0.1, fiber: 0 },
  { name: "Sugar", calories: 387, protein: 0, carbs: 100, fat: 0, fiber: 0 },
  { name: "Coconut Oil", calories: 862, protein: 0, carbs: 0, fat: 100, fiber: 0 },
  { name: "Olive Oil", calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0 },
  { name: "Soya Milk", calories: 33, protein: 2.9, carbs: 1.8, fat: 1.6, fiber: 0.4 },
  { name: "Granola", calories: 471, protein: 10, carbs: 64, fat: 20, fiber: 7 },
  { name: "Overnight Oats", calories: 150, protein: 5, carbs: 22, fat: 5, fiber: 3.5 },
  { name: "Popcorn Plain", calories: 375, protein: 11, carbs: 74, fat: 4, fiber: 15 },
  // ===== EXPANDED BREAKFAST & CEREALS =====
  { name: "Upma Rava", calories: 140, protein: 3.5, carbs: 28, fat: 2, fiber: 1.2 },
  { name: "Pongal", calories: 140, protein: 4, carbs: 26, fat: 2.5, fiber: 1.5 },
  { name: "Ven Pongal", calories: 180, protein: 4, carbs: 28, fat: 5, fiber: 1.5 },
  { name: "Bread Toast Butter", calories: 320, protein: 9, carbs: 52, fat: 8, fiber: 2 },
  { name: "Sandwich Vegetable", calories: 180, protein: 6, carbs: 28, fat: 5, fiber: 2 },
  { name: "Paratha Aloo", calories: 320, protein: 6, carbs: 45, fat: 12, fiber: 3 },
  { name: "Paratha Gobi", calories: 280, protein: 7, carbs: 42, fat: 9, fiber: 4 },
  { name: "Paratha Paneer", calories: 340, protein: 12, carbs: 38, fat: 16, fiber: 2 },
  { name: "Paratha Mooli", calories: 260, protein: 5, carbs: 40, fat: 8, fiber: 3 },
  { name: "Aloo Paratha", calories: 320, protein: 6, carbs: 45, fat: 12, fiber: 3 },
  { name: "Gobi Paratha", calories: 280, protein: 7, carbs: 42, fat: 9, fiber: 4 },
  { name: "Pesarattu", calories: 165, protein: 6, carbs: 26, fat: 3, fiber: 2 },
  { name: "Rava Dosa", calories: 180, protein: 4, carbs: 32, fat: 4, fiber: 1 },
  { name: "Masala Dosa", calories: 220, protein: 6, carbs: 35, fat: 6, fiber: 2 },
  { name: "Set Dosa", calories: 160, protein: 4, carbs: 28, fat: 3, fiber: 1 },
  { name: "Appam", calories: 150, protein: 3, carbs: 30, fat: 2, fiber: 1 },
  { name: "Paniyaram", calories: 185, protein: 5, carbs: 28, fat: 5, fiber: 2 },
  { name: "Adai", calories: 195, protein: 8, carbs: 28, fat: 5, fiber: 4 },
  { name: "Poha Chivda", calories: 400, protein: 8, carbs: 58, fat: 16, fiber: 4 },
  { name: "Bajra Roti", calories: 295, protein: 8.75, carbs: 55, fat: 3.75, fiber: 6 },
  { name: "Jowar Roti", calories: 288, protein: 7.5, carbs: 57.5, fat: 2.5, fiber: 5 },
  { name: "Makki ki Roti", calories: 310, protein: 7, carbs: 52, fat: 8, fiber: 4 },
  { name: "Missi Roti", calories: 290, protein: 10, carbs: 48, fat: 6, fiber: 5 },
  { name: "Tandoori Roti", calories: 300, protein: 9, carbs: 54, fat: 5, fiber: 3 },
  { name: "Rumali Roti", calories: 280, protein: 8, carbs: 52, fat: 4, fiber: 2 },
  { name: "Phulka", calories: 290, protein: 8.5, carbs: 56, fat: 4, fiber: 4 },
  { name: "Chapati", calories: 300, protein: 8.75, carbs: 55, fat: 5, fiber: 4 },
  { name: "Batura", calories: 360, protein: 8, carbs: 52, fat: 14, fiber: 2 },
  { name: "Kulcha", calories: 310, protein: 8, carbs: 52, fat: 8, fiber: 2 },
  { name: "Luchi", calories: 380, protein: 6, carbs: 48, fat: 18, fiber: 2 },
  // ===== MORE DALS & LEGUMES =====
  { name: "Dal Fry", calories: 120, protein: 6, carbs: 16, fat: 3, fiber: 4 },
  { name: "Dal Palak", calories: 95, protein: 6, carbs: 12, fat: 2.5, fiber: 4 },
  { name: "Dal Dhokli", calories: 130, protein: 6, carbs: 20, fat: 3, fiber: 4 },
  { name: "Kadhi Pakora", calories: 140, protein: 5, carbs: 18, fat: 5, fiber: 2 },
  { name: "Kadhi", calories: 85, protein: 4, carbs: 10, fat: 3, fiber: 0.5 },
  { name: "Chana Masala", calories: 180, protein: 8, carbs: 26, fat: 5, fiber: 8 },
  { name: "Chole", calories: 164, protein: 9, carbs: 27, fat: 2.5, fiber: 7.6 },
  { name: "Rajma Masala", calories: 140, protein: 9, carbs: 22, fat: 2, fiber: 6 },
  { name: "Lobia Curry", calories: 130, protein: 8, carbs: 22, fat: 1.5, fiber: 6 },
  { name: "Methi Chaman", calories: 160, protein: 9, carbs: 8, fat: 11, fiber: 2 },
  { name: "Kadhi Chawal", calories: 110, protein: 4, carbs: 18, fat: 3, fiber: 1 },
  { name: "Dal Khichdi", calories: 125, protein: 5, carbs: 22, fat: 2.5, fiber: 2 },
  { name: "Moong Dal Halwa", calories: 350, protein: 6, carbs: 45, fat: 16, fiber: 2 },
  { name: "Panchmel Dal", calories: 115, protein: 7, carbs: 16, fat: 2.5, fiber: 5 },
  { name: "Dal Bukhara", calories: 160, protein: 8, carbs: 20, fat: 5, fiber: 6 },
  { name: "Kala Chana Curry", calories: 155, protein: 8, carbs: 24, fat: 3, fiber: 6 },
  { name: "White Chana Curry", calories: 170, protein: 8, carbs: 26, fat: 4, fiber: 7 },
  { name: "Sambar Sadam", calories: 95, protein: 4, carbs: 18, fat: 2, fiber: 2 },
  { name: "Rasam", calories: 35, protein: 2, carbs: 6, fat: 0.5, fiber: 1 },
  { name: "Sambar", calories: 60, protein: 3, carbs: 8, fat: 1.5, fiber: 2.5 },
  // ===== MORE SABZIS & VEGETABLES =====
  { name: "Aloo Gobi", calories: 95, protein: 2.5, carbs: 14, fat: 3, fiber: 2.5 },
  { name: "Aloo Matar", calories: 110, protein: 3, carbs: 18, fat: 3, fiber: 3 },
  { name: "Aloo Jeera", calories: 120, protein: 2, carbs: 22, fat: 3, fiber: 2 },
  { name: "Aloo Palak", calories: 85, protein: 2.5, carbs: 12, fat: 3, fiber: 2 },
  { name: "Baingan Bharta", calories: 95, protein: 2, carbs: 12, fat: 4, fiber: 3 },
  { name: "Baingan Ka Bharta", calories: 95, protein: 2, carbs: 12, fat: 4, fiber: 3 },
  { name: "Capsicum Sabzi", calories: 55, protein: 2, carbs: 9, fat: 2, fiber: 2 },
  { name: "Shimla Mirch Sabzi", calories: 55, protein: 2, carbs: 9, fat: 2, fiber: 2 },
  { name: "Mix Vegetable", calories: 75, protein: 2.5, carbs: 11, fat: 2.5, fiber: 2.5 },
  { name: "Vegetable Jalfrezi", calories: 90, protein: 3, carbs: 12, fat: 3, fiber: 2 },
  { name: "Karela Sabzi", calories: 65, protein: 2, carbs: 10, fat: 2, fiber: 2 },
  { name: "Tori Sabzi", calories: 50, protein: 1.5, carbs: 8, fat: 1.5, fiber: 1.5 },
  { name: "Gawar Sabzi", calories: 70, protein: 3, carbs: 12, fat: 1.5, fiber: 4 },
  { name: "French Beans Sabzi", calories: 45, protein: 2, carbs: 8, fat: 0.5, fiber: 3 },
  { name: "Matar Mushroom", calories: 85, protein: 5, carbs: 10, fat: 3, fiber: 2 },
  { name: "Mushroom Matar", calories: 85, protein: 5, carbs: 10, fat: 3, fiber: 2 },
  { name: "Paneer Tikka", calories: 220, protein: 14, carbs: 6, fat: 16, fiber: 0.5 },
  { name: "Kadai Paneer", calories: 210, protein: 11, carbs: 10, fat: 15, fiber: 2 },
  { name: "Shahi Paneer", calories: 240, protein: 10, carbs: 8, fat: 18, fiber: 1 },
  { name: "Paneer Do Pyaza", calories: 190, protein: 10, carbs: 12, fat: 12, fiber: 2 },
  { name: "Paneer Pasanda", calories: 260, protein: 12, carbs: 10, fat: 20, fiber: 1 },
  { name: "Chilli Paneer", calories: 200, protein: 11, carbs: 12, fat: 12, fiber: 1 },
  { name: "Paneer 65", calories: 230, protein: 12, carbs: 8, fat: 18, fiber: 0.5 },
  { name: "Paneer Lababdar", calories: 250, protein: 11, carbs: 10, fat: 18, fiber: 1 },
  // ===== RICE DISHES =====
  { name: "Biryani Vegetable", calories: 180, protein: 5, carbs: 28, fat: 5, fiber: 2 },
  { name: "Pulao Vegetable", calories: 140, protein: 3, carbs: 26, fat: 3, fiber: 1.5 },
  { name: "Tamarind Rice", calories: 160, protein: 3, carbs: 32, fat: 2, fiber: 1 },
  { name: "Curd Rice", calories: 130, protein: 3.5, carbs: 25, fat: 2, fiber: 0.5 },
  { name: "Lemon Rice", calories: 155, protein: 2.5, carbs: 30, fat: 3, fiber: 0.5 },
  { name: "Coconut Rice", calories: 180, protein: 3, carbs: 32, fat: 5, fiber: 1 },
  { name: "Tomato Rice", calories: 140, protein: 3, carbs: 28, fat: 2, fiber: 1 },
  { name: "Bisi Bele Bath", calories: 150, protein: 5, carbs: 26, fat: 3, fiber: 3 },
  { name: "Pongal Ven", calories: 180, protein: 4, carbs: 28, fat: 5, fiber: 1.5 },
  { name: "Venn Pongal", calories: 180, protein: 4, carbs: 28, fat: 5, fiber: 1.5 },
  { name: "Fried Rice Vegetable", calories: 160, protein: 4, carbs: 28, fat: 4, fiber: 1.5 },
  { name: "Schezwan Rice", calories: 170, protein: 4, carbs: 30, fat: 4, fiber: 1 },
  { name: "Rice Pulao", calories: 140, protein: 3, carbs: 26, fat: 3, fiber: 1.5 },
  { name: "Vangi Bath", calories: 165, protein: 4, carbs: 28, fat: 4, fiber: 2 },
  { name: "Pulao Peas", calories: 135, protein: 4, carbs: 25, fat: 2.5, fiber: 2 },
  // ===== MORE SNACKS & STREET FOOD =====
  { name: "Samosa", calories: 310, protein: 6, carbs: 38, fat: 16, fiber: 2.5 },
  { name: "Samosa Aloo", calories: 310, protein: 6, carbs: 38, fat: 16, fiber: 2.5 },
  { name: "Samosa Paneer", calories: 340, protein: 10, carbs: 36, fat: 18, fiber: 2 },
  { name: "Pakora Mix", calories: 280, protein: 8, carbs: 28, fat: 16, fiber: 3 },
  { name: "Onion Pakora", calories: 265, protein: 6, carbs: 30, fat: 14, fiber: 2 },
  { name: "Palak Pakora", calories: 220, protein: 7, carbs: 24, fat: 11, fiber: 3 },
  { name: "Paneer Pakora", calories: 290, protein: 12, carbs: 22, fat: 18, fiber: 1 },
  { name: "Bread Pakora", calories: 320, protein: 9, carbs: 38, fat: 15, fiber: 2 },
  { name: "Aloo Tikki", calories: 250, protein: 4, carbs: 32, fat: 12, fiber: 2 },
  { name: "Pav Bhaji", calories: 150, protein: 4, carbs: 22, fat: 5, fiber: 3 },
  { name: "Vada Pav", calories: 280, protein: 8, carbs: 38, fat: 12, fiber: 2 },
  { name: "Dahi Vada", calories: 140, protein: 6, carbs: 20, fat: 4, fiber: 1 },
  { name: "Dahi Bhalla", calories: 140, protein: 6, carbs: 20, fat: 4, fiber: 1 },
  { name: "Papdi Chaat", calories: 220, protein: 6, carbs: 32, fat: 8, fiber: 2 },
  { name: "Aloo Chaat", calories: 180, protein: 3, carbs: 28, fat: 6, fiber: 2 },
  { name: "Fruit Chaat", calories: 65, protein: 1, carbs: 15, fat: 0.3, fiber: 2 },
  { name: "Masala Papad", calories: 380, protein: 14, carbs: 58, fat: 10, fiber: 8 },
  { name: "Roasted Papad", calories: 371, protein: 25, carbs: 59, fat: 1, fiber: 19 },
  { name: "Fried Papad", calories: 520, protein: 18, carbs: 60, fat: 28, fiber: 18 },
  { name: "Pani Puri", calories: 95, protein: 2, carbs: 18, fat: 2, fiber: 1 },
  { name: "Gol Gappa", calories: 95, protein: 2, carbs: 18, fat: 2, fiber: 1 },
  { name: "Dahi Puri", calories: 160, protein: 5, carbs: 25, fat: 4, fiber: 2 },
  { name: "Sev Puri", calories: 180, protein: 4, carbs: 28, fat: 6, fiber: 2 },
  { name: "Raj Kachori", calories: 280, protein: 7, carbs: 38, fat: 12, fiber: 4 },
  { name: "Aloo Tikki Chaat", calories: 220, protein: 4, carbs: 30, fat: 10, fiber: 2 },
  { name: "Pav", calories: 267, protein: 8, carbs: 50, fat: 3.3, fiber: 2.7 },
  // ===== MAHARASHTRIAN =====
  { name: "Poha Kanda", calories: 135, protein: 3, carbs: 29, fat: 1, fiber: 1.2 },
  { name: "Thalipeeth", calories: 220, protein: 7, carbs: 35, fat: 6, fiber: 4 },
  { name: "Zunka", calories: 120, protein: 8, carbs: 18, fat: 3, fiber: 4 },
  { name: "Bhakri Zunka", calories: 200, protein: 10, carbs: 32, fat: 5, fiber: 5 },
  { name: "Pitla", calories: 95, protein: 5, carbs: 14, fat: 2, fiber: 3 },
  { name: "Sabudana Thalipeeth", calories: 250, protein: 3, carbs: 45, fat: 6, fiber: 1 },
  { name: "Ukadiche Modak", calories: 200, protein: 4, carbs: 42, fat: 3, fiber: 2 },
  { name: "Puran Poli Maharashtrian", calories: 313, protein: 7.5, carbs: 56.3, fat: 7.5, fiber: 3 },
  { name: "Batata Vada", calories: 265, protein: 5, carbs: 32, fat: 13, fiber: 2 },
  { name: "Misal Pav", calories: 220, protein: 10, carbs: 28, fat: 8, fiber: 6 },
  { name: "Pav Bhaji Maharashtrian", calories: 150, protein: 4, carbs: 22, fat: 5, fiber: 3 },
  { name: "Shrikhand Puri", calories: 280, protein: 7, carbs: 42, fat: 9, fiber: 0.5 },
  // ===== MORE GUJARATI =====
  { name: "Fafda Jalebi", calories: 405, protein: 6, carbs: 60, fat: 16, fiber: 2 },
  { name: "Khaman", calories: 120, protein: 5, carbs: 22, fat: 1.5, fiber: 1 },
  { name: "Khaman Dhokla", calories: 120, protein: 5, carbs: 22, fat: 1.5, fiber: 1 },
  { name: "Dabeli", calories: 320, protein: 8, carbs: 45, fat: 12, fiber: 3 },
  { name: "Khandvi Roll", calories: 180, protein: 7, carbs: 22, fat: 7, fiber: 1 },
  { name: "Muthiya", calories: 217, protein: 8.3, carbs: 33.3, fat: 5, fiber: 3 },
  { name: "Oondhiyu", calories: 180, protein: 5, carbs: 22, fat: 8, fiber: 4 },
  { name: "Aamras Puri", calories: 280, protein: 3, carbs: 48, fat: 8, fiber: 1 },
  { name: "Ghari", calories: 380, protein: 8, carbs: 52, fat: 16, fiber: 2 },
  { name: "Ghughra", calories: 350, protein: 8, carbs: 45, fat: 16, fiber: 3 },
  // ===== MORE RAJASTHANI =====
  { name: "Pyaaz Kachori", calories: 360, protein: 8, carbs: 42, fat: 18, fiber: 2 },
  { name: "Mawa Kachori", calories: 420, protein: 8, carbs: 55, fat: 20, fiber: 1 },
  { name: "Mirchi Bada", calories: 320, protein: 6, carbs: 35, fat: 17, fiber: 2 },
  { name: "Pyaaz Ki Sabzi", calories: 90, protein: 2, carbs: 14, fat: 3, fiber: 2 },
  { name: "Kadhi Rajasthani", calories: 95, protein: 4, carbs: 9, fat: 4.5, fiber: 0.5 },
  { name: "Kadhi Haryana", calories: 90, protein: 4, carbs: 10, fat: 3.5, fiber: 0.5 },
  { name: "Mangodi Curry", calories: 140, protein: 8, carbs: 20, fat: 4, fiber: 5 },
  { name: "Papad Ki Sabzi", calories: 280, protein: 10, carbs: 42, fat: 10, fiber: 6 },
  // ===== SOUTH INDIAN ADDITIONS =====
  { name: "Idiyappam", calories: 115, protein: 2.5, carbs: 26, fat: 0.2, fiber: 1 },
  { name: "Puttu", calories: 130, protein: 3, carbs: 28, fat: 0.5, fiber: 2 },
  { name: "Appam with Stew", calories: 140, protein: 3, carbs: 24, fat: 4, fiber: 1 },
  { name: "Idli Sambar", calories: 95, protein: 4, carbs: 18, fat: 1, fiber: 2 },
  { name: "Dosa Sambar", calories: 130, protein: 4, carbs: 22, fat: 3, fiber: 2 },
  { name: "Vada Sambar", calories: 140, protein: 6, carbs: 22, fat: 4, fiber: 3 },
  { name: "Uttapam Onion", calories: 165, protein: 4.5, carbs: 27, fat: 4.5, fiber: 2 },
  { name: "Uttapam Tomato", calories: 160, protein: 4, carbs: 26, fat: 4, fiber: 2 },
  { name: "Masala Uttapam", calories: 170, protein: 5, carbs: 27, fat: 5, fiber: 2 },
  { name: "Rava Upma", calories: 140, protein: 3.5, carbs: 28, fat: 2, fiber: 1.2 },
  { name: "Aval Upma", calories: 130, protein: 3, carbs: 28, fat: 0.5, fiber: 1.2 },
  { name: "Bisibele Bath", calories: 150, protein: 5, carbs: 26, fat: 3, fiber: 3 },
  { name: "Tomato Bath", calories: 140, protein: 3, carbs: 28, fat: 2, fiber: 1 },
  { name: "Tamarind Rice", calories: 160, protein: 3, carbs: 32, fat: 2, fiber: 1 },
  { name: "Puliyodarai", calories: 160, protein: 3, carbs: 32, fat: 2, fiber: 1 },
  { name: "Pongal", calories: 140, protein: 4, carbs: 26, fat: 2.5, fiber: 1.5 },
  { name: "Avial", calories: 85, protein: 2.5, carbs: 12, fat: 3, fiber: 3 },
  { name: "Thoran", calories: 75, protein: 2.5, carbs: 10, fat: 3, fiber: 3 },
  { name: "Olān", calories: 70, protein: 2, carbs: 10, fat: 2.5, fiber: 2 },
  { name: "Kootu", calories: 90, protein: 4, carbs: 14, fat: 2, fiber: 4 },
  { name: "Poriyal", calories: 70, protein: 2, carbs: 10, fat: 2.5, fiber: 2 },
  { name: "Pachadi", calories: 95, protein: 2.5, carbs: 12, fat: 4, fiber: 1 },
  { name: "Pappadum", calories: 371, protein: 25, carbs: 59, fat: 1, fiber: 19 },
  { name: "Payasam", calories: 180, protein: 4, carbs: 32, fat: 4, fiber: 0.5 },
  { name: "Pal Payasam", calories: 190, protein: 5, carbs: 30, fat: 5, fiber: 0 },
  { name: "Semiya Payasam", calories: 200, protein: 4, carbs: 35, fat: 5, fiber: 0.5 },
  { name: "Pongal Ven Pongal", calories: 180, protein: 4, carbs: 28, fat: 5, fiber: 1.5 },
  // ===== NORTH INDIAN / PUNJABI =====
  { name: "Dal Makhani Punjabi", calories: 150, protein: 7, carbs: 16, fat: 6, fiber: 5 },
  { name: "Rajma Chawal", calories: 135, protein: 8, carbs: 22, fat: 2, fiber: 6 },
  { name: "Chole Bhature", calories: 280, protein: 8, carbs: 38, fat: 12, fiber: 6 },
  { name: "Bhatura", calories: 360, protein: 8, carbs: 52, fat: 14, fiber: 2 },
  { name: "Aloo Paratha Dahi", calories: 280, protein: 8, carbs: 42, fat: 10, fiber: 3 },
  { name: "Paneer Paratha", calories: 340, protein: 12, carbs: 38, fat: 16, fiber: 2 },
  { name: "Sarson Ka Saag", calories: 95, protein: 4, carbs: 12, fat: 4, fiber: 3 },
  { name: "Makki Ki Roti Sarson", calories: 300, protein: 7, carbs: 50, fat: 8, fiber: 4 },
  { name: "Kadhi Pakora Punjabi", calories: 140, protein: 5, carbs: 18, fat: 5, fiber: 2 },
  { name: "Pav Bhaji Punjabi", calories: 150, protein: 4, carbs: 22, fat: 5, fiber: 3 },
  { name: "Dal Tadka Punjabi", calories: 100, protein: 6, carbs: 14, fat: 2.5, fiber: 4 },
  { name: "Mix Veg Punjabi", calories: 90, protein: 3, carbs: 14, fat: 3, fiber: 2.5 },
  { name: "Jeera Aloo", calories: 120, protein: 2, carbs: 22, fat: 3, fiber: 2 },
  { name: "Dal Bukhari", calories: 160, protein: 8, carbs: 20, fat: 5, fiber: 6 },
  // ===== MORE SWEETS =====
  { name: "Rasmalai", calories: 250, protein: 8, carbs: 38, fat: 8, fiber: 0 },
  { name: "Rasgulla", calories: 186, protein: 4, carbs: 38, fat: 1, fiber: 0 },
  { name: "Gulab Jamun 2pc", calories: 300, protein: 6, carbs: 50, fat: 10, fiber: 0.3 },
  { name: "Soan Papdi", calories: 450, protein: 7, carbs: 65, fat: 20, fiber: 1 },
  { name: "Jalebi 2pc", calories: 360, protein: 2, carbs: 65, fat: 10, fiber: 0.5 },
  { name: "Imarti", calories: 340, protein: 4, carbs: 62, fat: 8, fiber: 0.5 },
  { name: "Mysore Pak", calories: 480, protein: 5, carbs: 55, fat: 28, fiber: 0.5 },
  { name: "Peda", calories: 380, protein: 8, carbs: 45, fat: 20, fiber: 0 },
  { name: "Ladoo Boondi", calories: 400, protein: 6, carbs: 58, fat: 18, fiber: 1 },
  { name: "Ladoo Coconut", calories: 420, protein: 4, carbs: 52, fat: 24, fiber: 4 },
  { name: "Halwa Gajar", calories: 200, protein: 2, carbs: 32, fat: 7, fiber: 2 },
  { name: "Halwa Moong Dal", calories: 350, protein: 6, carbs: 45, fat: 16, fiber: 2 },
  { name: "Halwa Carrot", calories: 200, protein: 2, carbs: 32, fat: 7, fiber: 2 },
  { name: "Gajar Ka Halwa", calories: 200, protein: 2, carbs: 32, fat: 7, fiber: 2 },
  { name: "Suji Ka Halwa", calories: 250, protein: 4, carbs: 38, fat: 9, fiber: 0.5 },
  { name: "Seviyan Kheer", calories: 180, protein: 4, carbs: 30, fat: 5, fiber: 0.5 },
  { name: "Phirni", calories: 170, protein: 5, carbs: 26, fat: 5, fiber: 0 },
  { name: "Seviyan", calories: 350, protein: 6, carbs: 58, fat: 10, fiber: 1 },
  { name: "Vermicelli Kheer", calories: 180, protein: 4, carbs: 30, fat: 5, fiber: 0.5 },
  { name: "Chhena Poda", calories: 320, protein: 12, carbs: 42, fat: 12, fiber: 0 },
  { name: "Rasabali", calories: 220, protein: 7, carbs: 32, fat: 7, fiber: 0 },
  { name: "Chhena Kheeri", calories: 200, protein: 7, carbs: 30, fat: 6, fiber: 0 },
  { name: "Sandesh", calories: 280, protein: 10, carbs: 35, fat: 12, fiber: 0 },
  { name: "Rasmalai 2pc", calories: 250, protein: 8, carbs: 38, fat: 8, fiber: 0 },
  { name: "Kalakand", calories: 350, protein: 8, carbs: 48, fat: 15, fiber: 0 },
  { name: "Doodh Peda", calories: 380, protein: 8, carbs: 45, fat: 20, fiber: 0 },
  // ===== MORE FRUITS =====
  { name: "Mango", calories: 60, protein: 0.8, carbs: 15, fat: 0.4, fiber: 1.6 },
  { name: "Sapota", calories: 83, protein: 0.4, carbs: 20, fat: 1.1, fiber: 5.3 },
  { name: "Fig Fresh", calories: 74, protein: 0.8, carbs: 19, fat: 0.3, fiber: 2.9 },
  { name: "Lychee", calories: 66, protein: 0.8, carbs: 16.5, fat: 0.4, fiber: 1.3 },
  { name: "Plum", calories: 46, protein: 0.7, carbs: 11, fat: 0.3, fiber: 1.4 },
  { name: "Peach", calories: 39, protein: 0.9, carbs: 9.5, fat: 0.3, fiber: 1.5 },
  { name: "Apricot", calories: 48, protein: 1.4, carbs: 11, fat: 0.4, fiber: 2 },
  { name: "Cherry", calories: 50, protein: 1, carbs: 12, fat: 0.3, fiber: 1.6 },
  { name: "Blueberries", calories: 57, protein: 0.7, carbs: 14.5, fat: 0.3, fiber: 2.4 },
  { name: "Raspberries", calories: 52, protein: 1.2, carbs: 12, fat: 0.7, fiber: 7 },
  { name: "Blackberries", calories: 43, protein: 1.4, carbs: 10, fat: 0.5, fiber: 5 },
  { name: "Cantaloupe", calories: 34, protein: 0.8, carbs: 8.2, fat: 0.2, fiber: 0.9 },
  { name: "Honeydew", calories: 36, protein: 0.5, carbs: 9.1, fat: 0.1, fiber: 0.8 },
  { name: "Muskmelon", calories: 34, protein: 0.8, carbs: 8.2, fat: 0.2, fiber: 0.9 },
  { name: "Litchi", calories: 66, protein: 0.8, carbs: 16.5, fat: 0.4, fiber: 1.3 },
  { name: "Dragon Fruit", calories: 60, protein: 1.2, carbs: 13, fat: 0.4, fiber: 3 },
  { name: "Avocado", calories: 160, protein: 2, carbs: 9, fat: 15, fiber: 7 },
  { name: "Olives", calories: 115, protein: 0.8, carbs: 6, fat: 11, fiber: 1.6 },
  { name: "Tomato", calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2 },
  { name: "Cucumber", calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1, fiber: 0.5 },
  { name: "Carrot", calories: 41, protein: 0.9, carbs: 10, fat: 0.2, fiber: 2.8 },
  { name: "Beetroot", calories: 43, protein: 1.6, carbs: 10, fat: 0.2, fiber: 2.8 },
  { name: "Radish", calories: 16, protein: 0.7, carbs: 3.4, fat: 0.1, fiber: 1.6 },
  { name: "Spinach", calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2 },
  { name: "Methi Leaves", calories: 49, protein: 4, carbs: 6, fat: 0.9, fiber: 4 },
  { name: "Coriander Leaves", calories: 23, protein: 2.1, carbs: 3.7, fat: 0.5, fiber: 2.8 },
  { name: "Mint", calories: 44, protein: 3.3, carbs: 8.4, fat: 0.7, fiber: 6.8 },
  { name: "Curry Leaves", calories: 108, protein: 6, carbs: 18, fat: 1, fiber: 6 },
  // ===== MORE NUTS & SEEDS =====
  { name: "Almond", calories: 579, protein: 21, carbs: 22, fat: 50, fiber: 12.5 },
  { name: "Cashew", calories: 553, protein: 18, carbs: 30, fat: 44, fiber: 3.3 },
  { name: "Walnut", calories: 654, protein: 15, carbs: 14, fat: 65, fiber: 6.7 },
  { name: "Macadamia", calories: 718, protein: 7.9, carbs: 14, fat: 76, fiber: 8.6 },
  { name: "Hazelnuts", calories: 628, protein: 15, carbs: 17, fat: 61, fiber: 9.7 },
  { name: "Pine Nuts", calories: 673, protein: 13.7, carbs: 13, fat: 68, fiber: 3.7 },
  { name: "Sunflower Seeds", calories: 584, protein: 21, carbs: 20, fat: 52, fiber: 8.6 },
  { name: "Watermelon Seeds", calories: 557, protein: 28, carbs: 15, fat: 47, fiber: 6 },
  { name: "Melon Seeds", calories: 557, protein: 28, carbs: 15, fat: 47, fiber: 6 },
  { name: "Makhana Raw", calories: 347, protein: 9, carbs: 76, fat: 0.5, fiber: 14.5 },
  // ===== BEVERAGES EXPANDED =====
  { name: "Chai", calories: 40, protein: 1.5, carbs: 5, fat: 1.5, fiber: 0 },
  { name: "Masala Chai", calories: 40, protein: 1.5, carbs: 5, fat: 1.5, fiber: 0 },
  { name: "Ginger Chai", calories: 35, protein: 1.5, carbs: 5, fat: 1, fiber: 0 },
  { name: "Elaichi Chai", calories: 42, protein: 1.5, carbs: 5.5, fat: 1.5, fiber: 0 },
  { name: "Coffee", calories: 2, protein: 0.3, carbs: 0, fat: 0, fiber: 0 },
  { name: "Cappuccino", calories: 45, protein: 2.5, carbs: 5, fat: 2, fiber: 0 },
  { name: "Latte", calories: 55, protein: 3, carbs: 6, fat: 2.5, fiber: 0 },
  { name: "Milk Shake Chocolate", calories: 120, protein: 4, carbs: 22, fat: 3, fiber: 1 },
  { name: "Milk Shake Banana", calories: 130, protein: 4, carbs: 24, fat: 3, fiber: 1.5 },
  { name: "Milk Shake Mango", calories: 125, protein: 3.5, carbs: 25, fat: 2.5, fiber: 0.5 },
  { name: "Lassi Mango", calories: 95, protein: 3, carbs: 18, fat: 2, fiber: 0 },
  { name: "Lassi Plain", calories: 45, protein: 3, carbs: 4, fat: 1.5, fiber: 0 },
  { name: "Shikanji", calories: 50, protein: 0.5, carbs: 12, fat: 0.2, fiber: 0 },
  { name: "Jal Jeera", calories: 30, protein: 0.5, carbs: 7, fat: 0.1, fiber: 0 },
  { name: "Kokum Sherbet", calories: 45, protein: 0.3, carbs: 11, fat: 0.1, fiber: 0 },
  { name: "Sol Kadi", calories: 35, protein: 1, carbs: 6, fat: 1, fiber: 0 },
  { name: "Bael Sherbet", calories: 55, protein: 0.5, carbs: 14, fat: 0.1, fiber: 0 },
  { name: "Rooh Afza", calories: 90, protein: 0, carbs: 22, fat: 0, fiber: 0 },
  { name: "Rose Milk", calories: 85, protein: 2.5, carbs: 14, fat: 2, fiber: 0 },
  { name: "Kesar Milk", calories: 95, protein: 3, carbs: 14, fat: 2.5, fiber: 0 },
  // ===== GRAINS & FLOUR =====
  { name: "Rice Raw", calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4 },
  { name: "Wheat Flour", calories: 364, protein: 10, carbs: 76, fat: 1, fiber: 2.7 },
  { name: "Besan", calories: 387, protein: 22, carbs: 58, fat: 6.7, fiber: 11 },
  { name: "Rava Sooji", calories: 369, protein: 8, carbs: 77, fat: 1, fiber: 2.7 },
  { name: "Rice Flour", calories: 366, protein: 6, carbs: 80, fat: 1.4, fiber: 2.4 },
  { name: "Sabudana", calories: 358, protein: 0.2, carbs: 88, fat: 0, fiber: 0.9 },
  { name: "Poha Flattened Rice", calories: 360, protein: 7, carbs: 77, fat: 2.5, fiber: 1 },
  { name: "Quinoa Cooked", calories: 120, protein: 4.4, carbs: 21, fat: 1.9, fiber: 2.8 },
  { name: "Barley", calories: 123, protein: 2.3, carbs: 28, fat: 0.4, fiber: 3.8 },
  { name: "Buckwheat", calories: 343, protein: 13, carbs: 72, fat: 3.4, fiber: 10 },
  // ===== CONDIMENTS & SAUCES =====
  { name: "Tomato Ketchup", calories: 112, protein: 1.8, carbs: 25, fat: 0.1, fiber: 0.4 },
  { name: "Green Chutney", calories: 95, protein: 2.5, carbs: 15, fat: 3, fiber: 2 },
  { name: "Coconut Chutney", calories: 180, protein: 3, carbs: 12, fat: 15, fiber: 4 },
  { name: "Tamarind Chutney", calories: 180, protein: 0.5, carbs: 45, fat: 0.2, fiber: 0.5 },
  { name: "Mint Chutney", calories: 95, protein: 2.5, carbs: 15, fat: 3, fiber: 2 },
  { name: "Coriander Chutney", calories: 95, protein: 2.5, carbs: 15, fat: 3, fiber: 2 },
  { name: "Pickle Mango", calories: 185, protein: 1, carbs: 35, fat: 5, fiber: 2 },
  { name: "Pickle Lemon", calories: 90, protein: 1, carbs: 18, fat: 2, fiber: 2 },
  { name: "Pickle Mixed", calories: 150, protein: 1.5, carbs: 28, fat: 4, fiber: 2 },
  // ===== SOUPS =====
  { name: "Tomato Soup", calories: 40, protein: 1.5, carbs: 8, fat: 0.5, fiber: 1 },
  { name: "Vegetable Soup", calories: 35, protein: 1.5, carbs: 6, fat: 0.5, fiber: 1.5 },
  { name: "Dal Soup", calories: 70, protein: 4, carbs: 10, fat: 2, fiber: 2 },
  { name: "Sweet Corn Soup", calories: 55, protein: 2, carbs: 10, fat: 1, fiber: 1 },
  { name: "Hot and Sour Soup", calories: 45, protein: 2, carbs: 7, fat: 1, fiber: 0.5 },
  { name: "Manchow Soup", calories: 50, protein: 2, carbs: 8, fat: 1.5, fiber: 0.5 },
  // ===== SALADS =====
  { name: "Green Salad", calories: 25, protein: 1.5, carbs: 4, fat: 0.5, fiber: 1.5 },
  { name: "Cucumber Salad", calories: 20, protein: 1, carbs: 4, fat: 0.2, fiber: 0.5 },
  { name: "Koshimbir", calories: 45, protein: 2, carbs: 8, fat: 1, fiber: 2 },
  { name: "Fruit Salad", calories: 55, protein: 0.8, carbs: 14, fat: 0.2, fiber: 2 },
  { name: "Chana Salad", calories: 140, protein: 7, carbs: 22, fat: 3, fiber: 6 },
  { name: "Sprout Salad", calories: 55, protein: 4, carbs: 8, fat: 1, fiber: 2 },
  // ===== BISCUITS & BAKED =====
  { name: "Marie Biscuit", calories: 440, protein: 8, carbs: 74, fat: 12, fiber: 2 },
  { name: "Cream Biscuit", calories: 480, protein: 6, carbs: 68, fat: 22, fiber: 1.5 },
  { name: "Digestive Biscuit", calories: 478, protein: 7, carbs: 68, fat: 22, fiber: 3 },
  { name: "Oreo", calories: 474, protein: 5, carbs: 72, fat: 20, fiber: 2 },
  { name: "Rusk", calories: 407, protein: 9, carbs: 72, fat: 9, fiber: 2 },
  { name: "Toast", calories: 290, protein: 9, carbs: 54, fat: 4, fiber: 2.5 },
  { name: "Croissant", calories: 406, protein: 8.2, carbs: 45, fat: 21, fiber: 2.6 },
  { name: "Muffin Plain", calories: 377, protein: 5.5, carbs: 53, fat: 16, fiber: 1.5 },
  { name: "Cake Plain", calories: 350, protein: 5, carbs: 52, fat: 14, fiber: 1 },
  { name: "Brownie", calories: 405, protein: 5, carbs: 52, fat: 21, fiber: 2 },
  // ===== READY TO EAT / PACKAGED =====
  { name: "Corn Flakes With Milk", calories: 165, protein: 5, carbs: 28, fat: 3, fiber: 1 },
  { name: "Muesli With Milk", calories: 180, protein: 6, carbs: 28, fat: 5, fiber: 3 },
  { name: "Oats With Milk", calories: 95, protein: 4, carbs: 15, fat: 2.5, fiber: 1.5 },
  { name: "Upma Ready Mix", calories: 380, protein: 9, carbs: 62, fat: 11, fiber: 3 },
  { name: "Poha Ready Mix", calories: 365, protein: 8, carbs: 76, fat: 4, fiber: 2 },
  { name: "Idli Mix", calories: 355, protein: 10, carbs: 72, fat: 3, fiber: 2 },
  { name: "Dosa Mix", calories: 350, protein: 8, carbs: 72, fat: 4, fiber: 2 },
  { name: "Pasta Cooked", calories: 131, protein: 5, carbs: 25, fat: 1.1, fiber: 1.8 },
  { name: "Noodles Cooked", calories: 138, protein: 4.5, carbs: 25, fat: 2.1, fiber: 1.2 },
  { name: "Maggi", calories: 440, protein: 10, carbs: 68, fat: 16, fiber: 3 },
  { name: "Vermicelli Cooked", calories: 130, protein: 3, carbs: 27, fat: 0.5, fiber: 1 },
  // ===== EXTRA REGIONAL =====
  { name: "Poha Jalebi", calories: 245, protein: 2.5, carbs: 46, fat: 5, fiber: 0.8 },
  { name: "Pav Bhaji Spicy", calories: 155, protein: 4, carbs: 22, fat: 5.5, fiber: 3 },
  { name: "Vada Curry", calories: 180, protein: 6, carbs: 24, fat: 6, fiber: 3 },
  { name: "Sambar Vadai", calories: 150, protein: 6, carbs: 22, fat: 4, fiber: 3 },
  { name: "Medu Vada 2pc", calories: 200, protein: 8, carbs: 28, fat: 8, fiber: 3 },
  { name: "Idli 2pc", calories: 98, protein: 5, carbs: 20, fat: 0.5, fiber: 1.5 },
  { name: "Dosa 1pc", calories: 171, protein: 4.3, carbs: 29, fat: 4.3, fiber: 1 },
  { name: "Uttapam 1pc", calories: 150, protein: 4, carbs: 25, fat: 4, fiber: 1.5 },
  { name: "Puri 2pc", calories: 367, protein: 6.7, carbs: 47, fat: 16.7, fiber: 2.5 },
  { name: "Paratha 1pc", calories: 300, protein: 6.7, carbs: 47, fat: 10, fiber: 3.5 },
  { name: "Roti 1pc", calories: 300, protein: 8.75, carbs: 55, fat: 5, fiber: 4 },
];

const STORAGE_KEY = "dashboard-nutrition";
const CUSTOM_FOODS_KEY = "custom_foods";
const RECIPES_KEY = "dashboard-recipes";
const SAVED_RECIPES_KEY = "saved_recipes";
const todayKey = () => new Date().toISOString().split("T")[0];

const DEFAULT_GOALS: MacroGoals = { calories: 2000, protein: 80, carbs: 250, fat: 65 };

interface CustomFood extends FoodItem {
  id: string;
  unitLabel?: string;
  gramsPerUnit?: number;
}

interface RecipeIngredient {
  food: FoodItem;
  grams: number;
}

interface Recipe {
  id: string;
  name: string;
  ingredients: RecipeIngredient[];
  servings: number;
  // per 100g macros (computed)
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  totalGrams: number;
}

interface StoredData {
  date: string;
  log: LogEntry[];
  goals: MacroGoals;
}

function loadData(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as StoredData;
      if (data.date === todayKey()) return data;
      return { date: todayKey(), log: [], goals: data.goals || DEFAULT_GOALS };
    }
  } catch {}
  return { date: todayKey(), log: [], goals: DEFAULT_GOALS };
}
function saveData(data: StoredData) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

function loadCustomFoods(): CustomFood[] {
  try { const r = localStorage.getItem(CUSTOM_FOODS_KEY); return r ? JSON.parse(r) : []; } catch { return []; }
}
function saveCustomFoods(foods: CustomFood[]) { localStorage.setItem(CUSTOM_FOODS_KEY, JSON.stringify(foods)); }

function loadRecipes(): Recipe[] {
  try { const r = localStorage.getItem(RECIPES_KEY); return r ? JSON.parse(r) : []; } catch { return []; }
}
function saveRecipes(recipes: Recipe[]) { localStorage.setItem(RECIPES_KEY, JSON.stringify(recipes)); }

function MacroBar({ label, current, goal, color }: { label: string; current: number; goal: number; color: string }) {
  const pct = Math.min((current / goal) * 100, 100);
  const over = current > goal;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={over ? "text-destructive font-medium" : "text-foreground font-medium"}>
          {Math.round(current)}
          <span className="text-muted-foreground font-normal">/{goal}{label === "Calories" ? "" : "g"}</span>
        </span>
      </div>
      <div className="w-full h-3.5 rounded-full bg-white/15 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${over ? "bg-destructive" : ""}`} style={{ width: `${pct}%`, backgroundColor: over ? undefined : color }} />
      </div>
    </div>
  );
}

const PIE_COLORS = { protein: "hsl(200, 60%, 50%)", carbs: "hsl(38, 70%, 55%)", fat: "hsl(0, 60%, 55%)" };

function MacroPieChart({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
  const proteinCal = protein * 4, carbsCal = carbs * 4, fatCal = fat * 9;
  const total = proteinCal + carbsCal + fatCal;
  if (total === 0) return (
    <div className="flex items-center justify-center">
      <div className="w-24 h-24 rounded-full border-2 border-dashed border-border flex items-center justify-center">
        <span className="text-sm text-muted-foreground">No data</span>
      </div>
    </div>
  );
  const pPct = (proteinCal / total) * 100, cPct = (carbsCal / total) * 100, fPct = (fatCal / total) * 100;
  const r = 42, cx = 50, cy = 50, circumference = 2 * Math.PI * r;
  const segments = [{ pct: pPct, color: PIE_COLORS.protein }, { pct: cPct, color: PIE_COLORS.carbs }, { pct: fPct, color: PIE_COLORS.fat }];
  let offset = 0;
  return (
    <div className="flex flex-col items-center gap-2.5">
      <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90">
        {segments.map((seg, i) => { const dash = (seg.pct / 100) * circumference; const gap = circumference - dash; const so = -offset; offset += dash; return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color} strokeWidth="12" strokeDasharray={`${dash} ${gap}`} strokeDashoffset={so} className="transition-all duration-500" />; })}
      </svg>
      <div className="flex gap-4 text-sm">
        <span style={{ color: PIE_COLORS.protein }}>● P {Math.round(pPct)}%</span>
        <span style={{ color: PIE_COLORS.carbs }}>● C {Math.round(cPct)}%</span>
        <span style={{ color: PIE_COLORS.fat }}>● F {Math.round(fPct)}%</span>
      </div>
    </div>
  );
}

// Modal wrapper
function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto p-6 flex flex-col gap-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-[17px] font-semibold text-foreground">{title}</h3>
          <button onClick={onClose} className="icon-btn w-9 h-9 min-w-0 min-h-0 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function NutritionTracker() {
  const { toast } = useToast();
  const [data, setData] = useState<StoredData>(loadData);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [quantity, setQuantity] = useState("1");
  const [useGramMode, setUseGramMode] = useState(false);
  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [showGoals, setShowGoals] = useState(false);
  const [editGoals, setEditGoals] = useState<MacroGoals>(data.goals);

  // Custom foods
  const [customFoods, setCustomFoods] = useState<CustomFood[]>(loadCustomFoods);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [editingCustom, setEditingCustom] = useState<CustomFood | null>(null);
  const [showMyFoods, setShowMyFoods] = useState(false);
  const [cf, setCf] = useState({ name: "", calories: "", protein: "", carbs: "", fat: "", fiber: "", unitLabel: "", gramsPerUnit: "" });

  // Recipes
  const [recipes, setRecipes] = useState<Recipe[]>(loadRecipes);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [showMyRecipes, setShowMyRecipes] = useState(false);
  const [recipeName, setRecipeName] = useState("");
  const [recipeServings, setRecipeServings] = useState("1");
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([]);
  const [recipeSearch, setRecipeSearch] = useState("");
  const [recipeShowDrop, setRecipeShowDrop] = useState(false);

  useEffect(() => { saveData(data); }, [data]);
  useEffect(() => { saveCustomFoods(customFoods); }, [customFoods]);
  useEffect(() => { saveRecipes(recipes); }, [recipes]);

  // Build combined unit map with custom food units
  const dynamicUnitMap: Record<string, UnitInfo> = { ...UNIT_MAP };
  customFoods.forEach((f) => { if (f.unitLabel && f.gramsPerUnit) dynamicUnitMap[f.name] = { unitLabel: f.unitLabel, gramsPerUnit: f.gramsPerUnit }; });
  recipes.forEach((r) => { dynamicUnitMap[r.name] = { unitLabel: "serving", gramsPerUnit: r.totalGrams / r.servings }; });

  const selectedUnit = selected ? dynamicUnitMap[selected.name] : null;
  const hasUnit = !!selectedUnit;
  const effectiveGramMode = !hasUnit || useGramMode;
  const computedGrams = effectiveGramMode ? parseFloat(quantity) : (parseFloat(quantity) || 0) * (selectedUnit?.gramsPerUnit || 0);

  // All foods combined
  const allFoods: (FoodItem & { tag?: string })[] = [
    ...FOODS,
    ...customFoods.map((f) => ({ ...f, tag: "Custom" })),
    ...recipes.map((r) => ({ name: r.name, calories: r.calories, protein: r.protein, carbs: r.carbs, fat: r.fat, fiber: r.fiber, tag: "🍳 Recipe" })),
  ];

  const filtered = search.length > 0
    ? allFoods.filter((f) => f.name.toLowerCase().includes(search.toLowerCase())).slice(0, 10)
    : [];

  const selectFood = (food: FoodItem) => {
    setSelected(food);
    setSearch(food.name);
    setShowDropdown(false);
    const unit = dynamicUnitMap[food.name];
    if (unit) { setUseGramMode(false); setQuantity("1"); } else { setUseGramMode(true); setQuantity("100"); }
  };

  const addEntry = () => {
    if (!selected || !quantity) return;
    const g = computedGrams;
    if (isNaN(g) || g <= 0) return;
    setData((prev) => ({ ...prev, log: [...prev.log, { id: Date.now().toString(), food: selected, grams: g }] }));
    setSearch(""); setSelected(null); setQuantity("1"); setUseGramMode(false);
  };

  const removeEntry = (id: string) => { setData((prev) => ({ ...prev, log: prev.log.filter((e) => e.id !== id) })); };
  const resetLog = () => { setData((prev) => ({ ...prev, log: [] })); };
  const handleSaveGoals = () => { setData((prev) => ({ ...prev, goals: editGoals })); setShowGoals(false); };

  const totals = data.log.reduce((acc, entry) => {
    const m = entry.grams / 100;
    return { calories: acc.calories + entry.food.calories * m, protein: acc.protein + entry.food.protein * m, carbs: acc.carbs + entry.food.carbs * m, fat: acc.fat + entry.food.fat * m, fiber: acc.fiber + entry.food.fiber * m };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

  // Custom food handlers
  const openCustomModal = (food?: CustomFood) => {
    if (food) {
      setEditingCustom(food);
      setCf({ name: food.name, calories: String(food.calories), protein: String(food.protein), carbs: String(food.carbs), fat: String(food.fat), fiber: String(food.fiber), unitLabel: food.unitLabel || "", gramsPerUnit: food.gramsPerUnit ? String(food.gramsPerUnit) : "" });
    } else {
      setEditingCustom(null);
      setCf({ name: "", calories: "", protein: "", carbs: "", fat: "", fiber: "", unitLabel: "", gramsPerUnit: "" });
    }
    setShowCustomModal(true);
  };

  const saveCustomFood = () => {
    if (!cf.name || !cf.calories) return;
    const food: CustomFood = {
      id: editingCustom?.id || Date.now().toString(),
      name: cf.name, calories: Number(cf.calories), protein: Number(cf.protein) || 0, carbs: Number(cf.carbs) || 0,
      fat: Number(cf.fat) || 0, fiber: Number(cf.fiber) || 0,
      unitLabel: cf.unitLabel || undefined, gramsPerUnit: cf.gramsPerUnit ? Number(cf.gramsPerUnit) : undefined,
    };

    // Ensure localStorage array exists and update it directly
    try {
      const existingRaw = localStorage.getItem(CUSTOM_FOODS_KEY);
      const existing: CustomFood[] = existingRaw ? JSON.parse(existingRaw) : [];
      const updated = editingCustom
        ? existing.map((f) => (f.id === editingCustom.id ? food : f))
        : [...existing, food];
      localStorage.setItem(CUSTOM_FOODS_KEY, JSON.stringify(updated));
    } catch {
      // Fallback: still update in-memory state even if localStorage fails
    }

    // Keep React state in sync so search results update immediately
    if (editingCustom) {
      setCustomFoods((prev) => prev.map((f) => (f.id === editingCustom.id ? food : f)));
    } else {
      setCustomFoods((prev) => [...prev, food]);
    }

    setShowCustomModal(false);
    toast({ title: "Food saved!" });

    // Surface the newly saved food in the main search with Custom badge
    setSearch(food.name);
    setShowDropdown(true);
    setSelected(null);
  };

  const deleteCustomFood = (id: string) => { setCustomFoods((prev) => prev.filter((f) => f.id !== id)); };

  // Recipe handlers
  const allFoodsForRecipe = [...FOODS, ...customFoods];
  const recipeFiltered = recipeSearch.length > 0
    ? allFoodsForRecipe.filter((f) => f.name.toLowerCase().includes(recipeSearch.toLowerCase())).slice(0, 8)
    : [];

  const addRecipeIngredient = (food: FoodItem) => {
    const unit = dynamicUnitMap[food.name];
    const grams = unit ? unit.gramsPerUnit : 100;
    setRecipeIngredients((prev) => [...prev, { food, grams }]);
    setRecipeSearch("");
    setRecipeShowDrop(false);
  };

  const updateIngredientGrams = (idx: number, grams: number) => {
    setRecipeIngredients((prev) => prev.map((ing, i) => i === idx ? { ...ing, grams } : ing));
  };

  const removeIngredient = (idx: number) => {
    setRecipeIngredients((prev) => prev.filter((_, i) => i !== idx));
  };

  const recipeTotals = recipeIngredients.reduce((acc, ing) => {
    const m = ing.grams / 100;
    return { calories: acc.calories + ing.food.calories * m, protein: acc.protein + ing.food.protein * m, carbs: acc.carbs + ing.food.carbs * m, fat: acc.fat + ing.food.fat * m, fiber: acc.fiber + ing.food.fiber * m, grams: acc.grams + ing.grams };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, grams: 0 });

  const servingsNum = Math.max(1, Number(recipeServings) || 1);
  const perServing = {
    calories: recipeTotals.calories / servingsNum,
    protein: recipeTotals.protein / servingsNum,
    carbs: recipeTotals.carbs / servingsNum,
    fat: recipeTotals.fat / servingsNum,
    fiber: recipeTotals.fiber / servingsNum,
    grams: recipeTotals.grams / servingsNum,
  };

  const openRecipeModal = (recipe?: Recipe) => {
    if (recipe) {
      setEditingRecipe(recipe);
      setRecipeName(recipe.name);
      setRecipeServings(String(recipe.servings));
      setRecipeIngredients(recipe.ingredients);
    } else {
      setEditingRecipe(null);
      setRecipeName("");
      setRecipeServings("1");
      setRecipeIngredients([]);
    }
    setRecipeSearch("");
    setShowRecipeModal(true);
  };

  const saveRecipe = () => {
    if (!recipeName || recipeIngredients.length === 0) return;
    const totalG = recipeTotals.grams;
    // Store macros per 100g for compatibility with the main tracker
    const per100 = totalG > 0 ? {
      calories: (recipeTotals.calories / totalG) * 100,
      protein: (recipeTotals.protein / totalG) * 100,
      carbs: (recipeTotals.carbs / totalG) * 100,
      fat: (recipeTotals.fat / totalG) * 100,
      fiber: (recipeTotals.fiber / totalG) * 100,
    } : { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

    const recipe: Recipe = {
      id: editingRecipe?.id || Date.now().toString(),
      name: recipeName, ingredients: recipeIngredients, servings: servingsNum, totalGrams: totalG,
      ...per100,
    };
    if (editingRecipe) {
      setRecipes((prev) => prev.map((r) => r.id === editingRecipe.id ? recipe : r));
    } else {
      setRecipes((prev) => [...prev, recipe]);
    }
    setShowRecipeModal(false);
  };

  const deleteRecipe = (id: string) => { setRecipes((prev) => prev.filter((r) => r.id !== id)); };

  const totalFoodCount = FOODS.length + customFoods.length + recipes.length;

  return (
    <div className="section-card section-nutrition flex flex-col gap-5" style={{ animation: "fade-in 0.4s ease-out 0.35s forwards", opacity: "0" } as React.CSSProperties}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] font-semibold section-title-nutrition flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-nutrition/15 flex items-center justify-center">
            <span className="text-lg">🥗</span>
          </div>
          Nutrition Tracker <span className="text-sm text-muted-foreground font-normal ml-1">{totalFoodCount} foods</span>
        </h2>
        <div className="flex items-center gap-1.5">
          <button onClick={() => openRecipeModal()} className="icon-btn w-10 h-10 min-w-0 min-h-0 bg-nutrition/10 text-nutrition hover:bg-nutrition/20 transition-colors" title="Build a Recipe">
            <ChefHat className="w-[18px] h-[18px]" />
          </button>
          <button onClick={() => openCustomModal()} className="icon-btn w-10 h-10 min-w-0 min-h-0 bg-nutrition/10 text-nutrition hover:bg-nutrition/20 transition-colors" title="Create Custom Food">
            <Plus className="w-[18px] h-[18px]" />
          </button>
          <button onClick={() => { setShowGoals(!showGoals); setEditGoals(data.goals); }} className="icon-btn w-10 h-10 min-w-0 min-h-0 bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors" title="Set macro goals">
            <Settings2 className="w-[18px] h-[18px]" />
          </button>
          {data.log.length > 0 && (
            <button onClick={resetLog} className="icon-btn w-10 h-10 min-w-0 min-h-0 bg-secondary/50 text-muted-foreground hover:text-destructive transition-colors" title="Reset daily log">
              <RotateCcw className="w-[18px] h-[18px]" />
            </button>
          )}
        </div>
      </div>

      {/* My Foods / My Recipes links */}
      {(customFoods.length > 0 || recipes.length > 0) && (
        <div className="flex gap-4 text-sm">
          {customFoods.length > 0 && (
            <button onClick={() => setShowMyFoods(!showMyFoods)} className="text-nutrition hover:underline font-medium">
              My Foods ({customFoods.length})
            </button>
          )}
          {recipes.length > 0 && (
            <button onClick={() => setShowMyRecipes(!showMyRecipes)} className="text-nutrition hover:underline font-medium">
              My Recipes ({recipes.length})
            </button>
          )}
        </div>
      )}

      {/* My Foods list */}
      {showMyFoods && (
        <div className="bg-nutrition/5 border border-nutrition/10 rounded-xl p-4 flex flex-col gap-2 animate-fade-in">
          <span className="text-sm text-nutrition font-medium mb-1">My Custom Foods</span>
          {customFoods.map((f) => (
            <div key={f.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-secondary/40">
              <div>
                <span className="text-[15px] text-foreground">{f.name}</span>
                {f.unitLabel && <span className="text-sm text-muted-foreground ml-2">per {f.unitLabel} ≈{f.gramsPerUnit}g</span>}
                <div className="text-sm text-muted-foreground">{f.calories}cal · {f.protein}p · {f.carbs}c · {f.fat}f</div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openCustomModal(f)} className="icon-btn w-9 h-9 min-w-0 min-h-0 text-muted-foreground hover:text-foreground"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => deleteCustomFood(f.id)} className="icon-btn w-9 h-9 min-w-0 min-h-0 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* My Recipes list */}
      {showMyRecipes && (
        <div className="bg-nutrition/5 border border-nutrition/10 rounded-xl p-4 flex flex-col gap-2 animate-fade-in">
          <span className="text-sm text-nutrition font-medium mb-1">My Recipes</span>
          {recipes.map((r) => (
            <div key={r.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-secondary/40">
              <div>
                <span className="text-[15px] text-foreground">🍳 {r.name}</span>
                <span className="text-sm text-muted-foreground ml-2">{r.ingredients.length} ingredients · {r.servings} serving{r.servings > 1 ? "s" : ""}</span>
                <div className="text-sm text-muted-foreground">{Math.round(r.calories)}cal · {Math.round(r.protein)}p · {Math.round(r.carbs)}c · {Math.round(r.fat)}f /100g</div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openRecipeModal(r)} className="icon-btn w-9 h-9 min-w-0 min-h-0 text-muted-foreground hover:text-foreground"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => deleteRecipe(r.id)} className="icon-btn w-9 h-9 min-w-0 min-h-0 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Goals editor */}
      {showGoals && (
        <div className="bg-secondary/40 rounded-xl p-4 flex flex-col gap-3 animate-fade-in">
          <span className="text-sm text-muted-foreground font-medium">Daily Macro Goals</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(["calories", "protein", "carbs", "fat"] as const).map((key) => (
              <div key={key} className="flex flex-col gap-1.5">
                <label className="text-sm text-muted-foreground capitalize">{key}</label>
                <input type="number" value={editGoals[key]} onChange={(e) => setEditGoals({ ...editGoals, [key]: Number(e.target.value) })} className="input-styled" />
              </div>
            ))}
          </div>
          <button onClick={handleSaveGoals} className="self-end btn-primary bg-nutrition text-white hover:opacity-90">Save Goals</button>
        </div>
      )}

      {/* Macro bars + Pie chart */}
      <div className="flex flex-col sm:flex-row gap-5 items-start">
        <div className="flex-1 grid grid-cols-2 gap-x-5 gap-y-3 w-full">
          <MacroBar label="Calories" current={totals.calories} goal={data.goals.calories} color="hsl(25, 95%, 53%)" />
          <MacroBar label="Protein" current={totals.protein} goal={data.goals.protein} color="hsl(217, 91%, 60%)" />
          <MacroBar label="Carbs" current={totals.carbs} goal={data.goals.carbs} color="hsl(45, 80%, 50%)" />
          <MacroBar label="Fat" current={totals.fat} goal={data.goals.fat} color="hsl(350, 89%, 60%)" />
          <div className="col-span-2">
            <MacroBar label="Fiber" current={totals.fiber} goal={30} color="hsl(160, 60%, 45%)" />
          </div>
        </div>
        <MacroPieChart protein={totals.protein} carbs={totals.carbs} fat={totals.fat} />
      </div>

      {/* Search + add */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setShowDropdown(true); setSelected(null); }} onFocus={() => setShowDropdown(true)} placeholder="Search food..." className="input-styled w-full pl-12 pr-10" />
          {search && (<button onClick={() => { setSearch(""); setSelected(null); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>)}
          {showDropdown && filtered.length > 0 && !selected && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-xl z-20 py-1 max-h-64 overflow-y-auto">
              {filtered.map((f: any) => {
                const unit = dynamicUnitMap[f.name];
                return (
                  <button key={f.name + (f.tag || "")} onClick={() => selectFood(f)} className="w-full text-left px-4 py-3 text-[15px] text-foreground hover:bg-nutrition/5 transition-colors flex justify-between items-center gap-3 min-h-[48px]">
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="truncate">{f.name}</span>
                      {f.tag && <span className={`shrink-0 text-sm px-2 py-0.5 rounded-full font-medium ${f.tag === "Custom" ? "bg-orange-500/15 text-orange-400" : "bg-primary/15 text-primary"}`}>{f.tag}</span>}
                      {unit && <span className="text-muted-foreground text-sm shrink-0">per {unit.unitLabel} ≈{Math.round(unit.gramsPerUnit)}g</span>}
                    </span>
                    <span className="text-muted-foreground shrink-0 text-sm">{f.calories} cal</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-2 items-center">
            <div className="relative">
              <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder={effectiveGramMode ? "grams" : "How many?"} className="input-styled w-28 pr-8" min="0.1" step={effectiveGramMode ? "1" : "0.5"} />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{effectiveGramMode ? "g" : "×"}</span>
            </div>
            <button onClick={addEntry} disabled={!selected} className="btn-primary bg-nutrition text-white hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed shrink-0 px-6">
              <Plus className="w-5 h-5" />
            </button>
          </div>
          {selected && hasUnit && (
            <div className="flex flex-col gap-0.5">
              <button onClick={() => { setUseGramMode(!useGramMode); setQuantity(useGramMode ? "1" : String(Math.round(computedGrams) || 100)); }} className="text-sm text-nutrition hover:underline self-start">
                {effectiveGramMode ? `Use ${selectedUnit!.unitLabel} count` : "Enter grams instead"}
              </button>
              {!effectiveGramMode && quantity && parseFloat(quantity) > 0 && (
                <span className="text-sm text-muted-foreground">{quantity} {selectedUnit!.unitLabel}{parseFloat(quantity) !== 1 ? "s" : ""} = {Math.round(computedGrams)}g</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Food log */}
      {data.log.length > 0 && (
        <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto -mx-1 px-1">
          {data.log.map((entry) => {
            const m = entry.grams / 100;
            return (
              <div key={entry.id} className="group flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-secondary/40 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[15px] text-foreground truncate">{entry.food.name}</span>
                    <span className="text-sm text-muted-foreground shrink-0">{Math.round(entry.grams)}g</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-0.5">
                    {Math.round(entry.food.calories * m)} cal · {Math.round(entry.food.protein * m)}p · {Math.round(entry.food.carbs * m)}c · {Math.round(entry.food.fat * m)}f
                  </div>
                </div>
                <button onClick={() => removeEntry(entry.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {data.log.length === 0 && (
        <div className="text-center py-6">
          <p className="text-3xl mb-2">🍽️</p>
          <p className="text-[15px] text-white/70">No food logged yet</p>
          <p className="text-sm text-white/60 mt-1">Search and add foods to start tracking</p>
        </div>
      )}

      {/* Custom Food Modal */}
      <Modal open={showCustomModal} onClose={() => setShowCustomModal(false)} title={editingCustom ? "Edit Custom Food" : "Create Custom Food"}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground">Food Name *</label>
            <input value={cf.name} onChange={(e) => setCf({ ...cf, name: e.target.value })} placeholder="e.g. My Chocolate Milk" className="bg-secondary border border-border/60 rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent/40" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-muted-foreground">Serving Unit (optional)</label>
              <input value={cf.unitLabel} onChange={(e) => setCf({ ...cf, unitLabel: e.target.value })} placeholder="e.g. glass, piece, bowl" className="bg-secondary border border-border/60 rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent/40" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-muted-foreground">Grams per unit</label>
              <input type="number" value={cf.gramsPerUnit} onChange={(e) => setCf({ ...cf, gramsPerUnit: e.target.value })} placeholder="e.g. 300" className="bg-secondary border border-border/60 rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent/40" />
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground font-medium">Macros per 100g</span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(["calories", "protein", "carbs", "fat", "fiber"] as const).map((key) => (
              <div key={key} className="flex flex-col gap-1">
                <label className="text-[10px] text-muted-foreground capitalize">{key}{key === "calories" ? " *" : ""}</label>
                <input type="number" value={cf[key]} onChange={(e) => setCf({ ...cf, [key]: e.target.value })} className="bg-secondary border border-border/60 rounded-md px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent/40" />
              </div>
            ))}
          </div>
          <button onClick={saveCustomFood} disabled={!cf.name || !cf.calories} className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed">
            {editingCustom ? "Update Food" : "Save Food"}
          </button>
        </div>
      </Modal>

      {/* Recipe Builder Modal */}
      <Modal open={showRecipeModal} onClose={() => setShowRecipeModal(false)} title={editingRecipe ? "Edit Recipe" : "🍳 Build a Recipe"}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground">Recipe Name *</label>
            <input value={recipeName} onChange={(e) => setRecipeName(e.target.value)} placeholder="e.g. Ghee Khakra, Protein Shake" className="bg-secondary border border-border/60 rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent/40" />
          </div>

          {/* Ingredient search */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground">Add Ingredients</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <input value={recipeSearch} onChange={(e) => { setRecipeSearch(e.target.value); setRecipeShowDrop(true); }} onFocus={() => setRecipeShowDrop(true)} placeholder="Search food to add..." className="w-full bg-secondary border border-border/60 rounded-md pl-7 pr-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent/40" />
              {recipeShowDrop && recipeFiltered.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-xl z-30 py-1 max-h-36 overflow-y-auto">
                  {recipeFiltered.map((f) => {
                    const unit = dynamicUnitMap[f.name];
                    return (
                      <button key={f.name} onClick={() => addRecipeIngredient(f)} className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-secondary/60 transition-colors flex justify-between">
                        <span>{f.name} {unit && <span className="text-[10px] text-muted-foreground">≈{unit.gramsPerUnit}g/{unit.unitLabel}</span>}</span>
                        <span className="text-muted-foreground">{f.calories} cal</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Ingredients list with per-ingredient breakdown */}
          {recipeIngredients.length > 0 && (
            <div className="flex flex-col gap-1.5 bg-secondary/30 rounded-lg p-2">
              <div className="grid grid-cols-[1fr_60px_40px_40px_30px_30px_20px] gap-1 text-[9px] text-muted-foreground font-medium px-1">
                <span>Ingredient</span><span className="text-right">Qty(g)</span><span className="text-right">Cal</span><span className="text-right">P</span><span className="text-right">C</span><span className="text-right">F</span><span></span>
              </div>
              {recipeIngredients.map((ing, idx) => {
                const unit = dynamicUnitMap[ing.food.name];
                const m = ing.grams / 100;
                return (
                  <div key={idx} className="grid grid-cols-[1fr_60px_40px_40px_30px_30px_20px] gap-1 items-center text-xs px-1">
                    <span className="text-foreground truncate">{ing.food.name}</span>
                    <input type="number" value={ing.grams} onChange={(e) => updateIngredientGrams(idx, Number(e.target.value))} className="w-full bg-secondary border border-border/60 rounded px-1 py-1 text-xs text-foreground text-right focus:outline-none" min="1" />
                    <span className="text-muted-foreground text-right">{Math.round(ing.food.calories * m)}</span>
                    <span className="text-muted-foreground text-right">{(ing.food.protein * m).toFixed(1)}</span>
                    <span className="text-muted-foreground text-right">{Math.round(ing.food.carbs * m)}</span>
                    <span className="text-muted-foreground text-right">{(ing.food.fat * m).toFixed(1)}</span>
                    <button onClick={() => removeIngredient(idx)} className="text-muted-foreground hover:text-destructive justify-self-center"><X className="w-3 h-3" /></button>
                  </div>
                );
              })}
              <div className="grid grid-cols-[1fr_60px_40px_40px_30px_30px_20px] gap-1 items-center text-xs px-1 pt-1.5 border-t border-border/40 font-medium">
                <span className="text-foreground">Total</span>
                <span className="text-right text-muted-foreground">{Math.round(recipeTotals.grams)}g</span>
                <span className="text-right text-foreground">{Math.round(recipeTotals.calories)}</span>
                <span className="text-right text-foreground">{recipeTotals.protein.toFixed(1)}</span>
                <span className="text-right text-foreground">{Math.round(recipeTotals.carbs)}</span>
                <span className="text-right text-foreground">{recipeTotals.fat.toFixed(1)}</span>
                <span></span>
              </div>
            </div>
          )}

          {/* Servings */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-muted-foreground">This makes</label>
            <input type="number" value={recipeServings} onChange={(e) => setRecipeServings(e.target.value)} className="w-14 bg-secondary border border-border/60 rounded-md px-2 py-1 text-xs text-foreground text-center focus:outline-none" min="1" />
            <span className="text-[10px] text-muted-foreground">serving{servingsNum > 1 ? "s" : ""}</span>
          </div>

          {/* Per serving summary */}
          {recipeIngredients.length > 0 && (
            <div className="bg-secondary/50 rounded-lg p-3">
              <span className="text-[10px] text-muted-foreground font-medium">Per Serving ({Math.round(perServing.grams)}g)</span>
              <div className="grid grid-cols-5 gap-2 mt-1.5">
                {[
                  { label: "Cal", value: perServing.calories },
                  { label: "Protein", value: perServing.protein },
                  { label: "Carbs", value: perServing.carbs },
                  { label: "Fat", value: perServing.fat },
                  { label: "Fiber", value: perServing.fiber },
                ].map((m) => (
                  <div key={m.label} className="text-center">
                    <div className="text-xs font-medium text-foreground">{Math.round(m.value)}</div>
                    <div className="text-[9px] text-muted-foreground">{m.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={saveRecipe} disabled={!recipeName || recipeIngredients.length === 0} className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed">
            {editingRecipe ? "Update Recipe" : "Save Recipe"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
