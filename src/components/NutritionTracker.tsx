import { useState, useEffect } from "react";
import { Plus, Trash2, Settings2, RotateCcw, Search, X } from "lucide-react";

interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
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

const FOODS: FoodItem[] = [
  // ===== DALS & LEGUMES =====
  { name: "Toor Dal (cooked)", calories: 128, protein: 7.5, carbs: 21, fat: 0.6, fiber: 5 },
  { name: "Moong Dal (cooked)", calories: 105, protein: 7, carbs: 18, fat: 0.4, fiber: 4.5 },
  { name: "Moong Dal (dry)", calories: 347, protein: 24, carbs: 59, fat: 1.2, fiber: 16 },
  { name: "Masoor Dal (cooked)", calories: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 4 },
  { name: "Chana Dal (cooked)", calories: 164, protein: 8.5, carbs: 27, fat: 2.7, fiber: 5 },
  { name: "Urad Dal (cooked)", calories: 105, protein: 7.5, carbs: 15, fat: 1.5, fiber: 4 },
  { name: "Urad Dal (dry)", calories: 341, protein: 25, carbs: 59, fat: 1.4, fiber: 18 },
  { name: "Rajma (cooked)", calories: 127, protein: 8.7, carbs: 22, fat: 0.5, fiber: 6.4 },
  { name: "Chana / Chickpeas (cooked)", calories: 164, protein: 8.9, carbs: 27, fat: 2.6, fiber: 7.6 },
  { name: "Moong Sprouts", calories: 31, protein: 3, carbs: 4, fat: 0.2, fiber: 1.8 },
  { name: "Matki Sprouts", calories: 65, protein: 5, carbs: 9, fat: 0.5, fiber: 3 },
  { name: "Val Dal (cooked)", calories: 110, protein: 7, carbs: 18, fat: 0.5, fiber: 5 },
  { name: "Dal Fry", calories: 140, protein: 7, carbs: 18, fat: 4, fiber: 4.5 },
  { name: "Dal Tadka", calories: 145, protein: 7.5, carbs: 19, fat: 4.5, fiber: 4 },

  // ===== RICE & GRAINS =====
  { name: "Steamed Rice", calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4 },
  { name: "Jeera Rice", calories: 155, protein: 3, carbs: 28, fat: 3.5, fiber: 0.5 },
  { name: "Lemon Rice", calories: 160, protein: 3, carbs: 28, fat: 4, fiber: 0.5 },
  { name: "Curd Rice", calories: 130, protein: 3.5, carbs: 22, fat: 3, fiber: 0.3 },
  { name: "Pulao (veg)", calories: 145, protein: 3, carbs: 25, fat: 3.5, fiber: 1 },
  { name: "Biryani Rice (Jain)", calories: 170, protein: 3.5, carbs: 28, fat: 5, fiber: 1 },
  { name: "Brown Rice", calories: 112, protein: 2.6, carbs: 24, fat: 0.9, fiber: 1.8 },
  { name: "Quinoa (cooked)", calories: 120, protein: 4.4, carbs: 21, fat: 1.9, fiber: 2.8 },
  { name: "Oats (cooked)", calories: 71, protein: 2.5, carbs: 12, fat: 1.5, fiber: 1.7 },
  { name: "Daliya / Broken Wheat", calories: 76, protein: 2.6, carbs: 14, fat: 0.5, fiber: 2 },

  // ===== ROTIS & BREADS =====
  { name: "Roti (wheat)", calories: 297, protein: 9, carbs: 56, fat: 3.5, fiber: 4 },
  { name: "Paratha (plain)", calories: 326, protein: 8, carbs: 45, fat: 13, fiber: 3.5 },
  { name: "Puri", calories: 350, protein: 7, carbs: 45, fat: 16, fiber: 2.5 },
  { name: "Naan", calories: 290, protein: 8.5, carbs: 50, fat: 5.5, fiber: 2 },
  { name: "Bajra Roti", calories: 295, protein: 8, carbs: 55, fat: 5, fiber: 6 },
  { name: "Jowar Roti", calories: 290, protein: 8.5, carbs: 58, fat: 3, fiber: 5 },
  { name: "Chapati (multigrain)", calories: 280, protein: 10, carbs: 48, fat: 5, fiber: 6 },
  { name: "Nachni / Ragi Roti", calories: 280, protein: 7, carbs: 58, fat: 2.5, fiber: 4.5 },
  { name: "Makka Roti", calories: 310, protein: 7, carbs: 60, fat: 5, fiber: 5 },
  { name: "Bhakri (wheat)", calories: 310, protein: 9, carbs: 55, fat: 5, fiber: 4 },
  { name: "Thepla", calories: 310, protein: 8, carbs: 42, fat: 12, fiber: 4 },
  { name: "Methi Thepla", calories: 305, protein: 8.5, carbs: 40, fat: 12, fiber: 4.5 },
  { name: "Mathri", calories: 480, protein: 8, carbs: 50, fat: 28, fiber: 2 },

  // ===== PANEER DISHES =====
  { name: "Paneer (raw)", calories: 265, protein: 18, carbs: 1.2, fat: 21, fiber: 0 },
  { name: "Paneer Bhurji", calories: 220, protein: 15, carbs: 4, fat: 16, fiber: 0.5 },
  { name: "Palak Paneer", calories: 170, protein: 10, carbs: 6, fat: 12, fiber: 2 },
  { name: "Shahi Paneer", calories: 200, protein: 11, carbs: 8, fat: 14, fiber: 1 },
  { name: "Matar Paneer", calories: 180, protein: 10, carbs: 10, fat: 12, fiber: 3 },
  { name: "Paneer Tikka", calories: 250, protein: 16, carbs: 6, fat: 18, fiber: 1 },
  { name: "Paneer Butter Masala", calories: 230, protein: 12, carbs: 8, fat: 17, fiber: 1.5 },
  { name: "Kadai Paneer", calories: 210, protein: 12, carbs: 7, fat: 15, fiber: 1.5 },
  { name: "Paneer Paratha", calories: 280, protein: 10, carbs: 32, fat: 13, fiber: 2 },

  // ===== BREAKFAST & SNACKS =====
  { name: "Poha", calories: 130, protein: 2.5, carbs: 24, fat: 2.8, fiber: 1.2 },
  { name: "Upma", calories: 120, protein: 3.5, carbs: 18, fat: 3.8, fiber: 1.5 },
  { name: "Sabudana Khichdi", calories: 180, protein: 3, carbs: 35, fat: 4, fiber: 0.5 },
  { name: "Sabudana Vada", calories: 250, protein: 4, carbs: 35, fat: 11, fiber: 1 },
  { name: "Dhokla", calories: 160, protein: 6, carbs: 25, fat: 4, fiber: 1.5 },
  { name: "Khandvi", calories: 145, protein: 5, carbs: 18, fat: 5.5, fiber: 1 },
  { name: "Idli", calories: 130, protein: 4, carbs: 24, fat: 1, fiber: 1.5 },
  { name: "Dosa (plain)", calories: 168, protein: 4, carbs: 28, fat: 4, fiber: 1 },
  { name: "Masala Dosa (Jain)", calories: 190, protein: 4.5, carbs: 30, fat: 6, fiber: 1.5 },
  { name: "Uttapam", calories: 155, protein: 5, carbs: 26, fat: 3.5, fiber: 1.5 },
  { name: "Besan Chilla", calories: 180, protein: 8, carbs: 20, fat: 7, fiber: 3 },
  { name: "Moong Dal Chilla", calories: 150, protein: 9, carbs: 18, fat: 4, fiber: 3 },
  { name: "Handvo", calories: 175, protein: 5, carbs: 25, fat: 6, fiber: 2.5 },
  { name: "Murmura / Puffed Rice", calories: 394, protein: 6, carbs: 87, fat: 1.3, fiber: 1.5 },
  { name: "Makhana / Fox Nuts", calories: 332, protein: 9.7, carbs: 77, fat: 0.1, fiber: 14.5 },
  { name: "Makhana (roasted, ghee)", calories: 380, protein: 10, carbs: 70, fat: 8, fiber: 13 },
  { name: "Fafda", calories: 420, protein: 7, carbs: 45, fat: 24, fiber: 3 },
  { name: "Khakhra", calories: 380, protein: 10, carbs: 55, fat: 13, fiber: 5 },
  { name: "Sev (besan)", calories: 500, protein: 12, carbs: 42, fat: 32, fiber: 4 },
  { name: "Chivda / Trail Mix", calories: 430, protein: 8, carbs: 50, fat: 22, fiber: 3 },

  // ===== CURRIES & SABZIS =====
  { name: "Sambhar", calories: 65, protein: 3, carbs: 10, fat: 1.2, fiber: 2.5 },
  { name: "Rasam", calories: 25, protein: 1, carbs: 4, fat: 0.5, fiber: 0.5 },
  { name: "Kadhi", calories: 80, protein: 3, carbs: 8, fat: 4, fiber: 0.5 },
  { name: "Kadhi Pakoda", calories: 120, protein: 4, carbs: 10, fat: 7, fiber: 1 },
  { name: "Khichdi (dal rice)", calories: 120, protein: 4, carbs: 20, fat: 2, fiber: 2 },
  { name: "Dal Dhokli", calories: 150, protein: 5, carbs: 22, fat: 4.5, fiber: 2 },
  { name: "Sev Tameta", calories: 130, protein: 3, carbs: 15, fat: 6, fiber: 2 },
  { name: "Undhiyu (Jain style)", calories: 160, protein: 4, carbs: 15, fat: 9, fiber: 4 },
  { name: "Tindora Sabzi", calories: 70, protein: 2, carbs: 8, fat: 3, fiber: 2 },
  { name: "Dudhi / Lauki Sabzi", calories: 55, protein: 1.5, carbs: 6, fat: 3, fiber: 1.5 },
  { name: "Turai / Ridge Gourd", calories: 50, protein: 1.5, carbs: 5, fat: 2.5, fiber: 2 },
  { name: "Bhindi / Okra Sabzi", calories: 90, protein: 2, carbs: 8, fat: 5.5, fiber: 3 },
  { name: "Cabbage Sabzi", calories: 65, protein: 2, carbs: 7, fat: 3, fiber: 2.5 },
  { name: "Green Peas Curry", calories: 110, protein: 5, carbs: 14, fat: 3.5, fiber: 4 },
  { name: "Tomato Curry", calories: 70, protein: 1.5, carbs: 8, fat: 3.5, fiber: 1.5 },
  { name: "Mixed Veg (Jain)", calories: 85, protein: 3, carbs: 10, fat: 3.5, fiber: 3 },

  // ===== DAIRY =====
  { name: "Curd / Yogurt", calories: 60, protein: 3.5, carbs: 5, fat: 3.3, fiber: 0 },
  { name: "Greek Yogurt", calories: 97, protein: 9, carbs: 3.6, fat: 5, fiber: 0 },
  { name: "Lassi (sweet)", calories: 75, protein: 3, carbs: 12, fat: 2, fiber: 0 },
  { name: "Lassi (salted)", calories: 40, protein: 2.5, carbs: 4, fat: 1.5, fiber: 0 },
  { name: "Chaas / Buttermilk", calories: 20, protein: 1.5, carbs: 2.5, fat: 0.5, fiber: 0 },
  { name: "Milk (full fat)", calories: 62, protein: 3.2, carbs: 4.8, fat: 3.3, fiber: 0 },
  { name: "Milk (toned)", calories: 45, protein: 3, carbs: 5, fat: 1.5, fiber: 0 },
  { name: "Milk (skimmed)", calories: 34, protein: 3.4, carbs: 5, fat: 0.1, fiber: 0 },
  { name: "Cheese (cheddar)", calories: 402, protein: 25, carbs: 1.3, fat: 33, fiber: 0 },
  { name: "Cheese (mozzarella)", calories: 280, protein: 22, carbs: 2.2, fat: 22, fiber: 0 },
  { name: "Cream Cheese", calories: 342, protein: 6, carbs: 4, fat: 34, fiber: 0 },
  { name: "Ghee", calories: 900, protein: 0, carbs: 0, fat: 100, fiber: 0 },
  { name: "Butter", calories: 717, protein: 0.8, carbs: 0.1, fat: 81, fiber: 0 },
  { name: "Shrikhand", calories: 200, protein: 5, carbs: 30, fat: 7, fiber: 0 },
  { name: "Basundi", calories: 180, protein: 5, carbs: 25, fat: 7, fiber: 0 },

  // ===== FRUITS =====
  { name: "Apple", calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4 },
  { name: "Banana", calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6 },
  { name: "Mango", calories: 60, protein: 0.8, carbs: 15, fat: 0.4, fiber: 1.6 },
  { name: "Papaya", calories: 43, protein: 0.5, carbs: 11, fat: 0.3, fiber: 1.7 },
  { name: "Grapes", calories: 69, protein: 0.7, carbs: 18, fat: 0.2, fiber: 0.9 },
  { name: "Watermelon", calories: 30, protein: 0.6, carbs: 7.5, fat: 0.2, fiber: 0.4 },
  { name: "Orange", calories: 47, protein: 0.9, carbs: 12, fat: 0.1, fiber: 2.4 },
  { name: "Pomegranate", calories: 83, protein: 1.7, carbs: 19, fat: 1.2, fiber: 4 },
  { name: "Guava", calories: 68, protein: 2.6, carbs: 14, fat: 1, fiber: 5.4 },
  { name: "Chikoo / Sapota", calories: 83, protein: 0.4, carbs: 20, fat: 1.1, fiber: 5.3 },
  { name: "Pineapple", calories: 50, protein: 0.5, carbs: 13, fat: 0.1, fiber: 1.4 },
  { name: "Pear", calories: 57, protein: 0.4, carbs: 15, fat: 0.1, fiber: 3.1 },
  { name: "Dates (dried)", calories: 282, protein: 2.5, carbs: 75, fat: 0.4, fiber: 8 },

  // ===== DRY FRUITS & NUTS =====
  { name: "Almonds", calories: 579, protein: 21, carbs: 22, fat: 50, fiber: 12.5 },
  { name: "Cashews", calories: 553, protein: 18, carbs: 30, fat: 44, fiber: 3.3 },
  { name: "Walnuts", calories: 654, protein: 15, carbs: 14, fat: 65, fiber: 6.7 },
  { name: "Peanuts", calories: 567, protein: 26, carbs: 16, fat: 49, fiber: 8.5 },
  { name: "Pistachios", calories: 560, protein: 20, carbs: 28, fat: 45, fiber: 10 },
  { name: "Coconut (fresh)", calories: 354, protein: 3.3, carbs: 15, fat: 33, fiber: 9 },
  { name: "Coconut (dried / copra)", calories: 650, protein: 6.5, carbs: 24, fat: 62, fiber: 16 },
  { name: "Desiccated Coconut", calories: 660, protein: 6, carbs: 24, fat: 64, fiber: 17 },
  { name: "Raisins / Kishmish", calories: 299, protein: 3.1, carbs: 79, fat: 0.5, fiber: 3.7 },
  { name: "Anjeer / Figs (dried)", calories: 249, protein: 3.3, carbs: 64, fat: 0.9, fiber: 9.8 },
  { name: "Kaju Katli", calories: 500, protein: 10, carbs: 50, fat: 30, fiber: 1 },
  { name: "Dry Fruit Ladoo", calories: 450, protein: 10, carbs: 40, fat: 28, fiber: 4 },
  { name: "Peanut Butter", calories: 588, protein: 25, carbs: 20, fat: 50, fiber: 6 },
  { name: "Flax Seeds", calories: 534, protein: 18, carbs: 29, fat: 42, fiber: 27 },
  { name: "Chia Seeds", calories: 486, protein: 17, carbs: 42, fat: 31, fiber: 34 },
  { name: "Sunflower Seeds", calories: 584, protein: 21, carbs: 20, fat: 51, fiber: 8.6 },
  { name: "Pumpkin Seeds", calories: 559, protein: 30, carbs: 11, fat: 49, fiber: 6 },
  { name: "Sesame Seeds / Til", calories: 573, protein: 18, carbs: 23, fat: 50, fiber: 12 },

  // ===== BEVERAGES & JUICES =====
  { name: "Orange Juice", calories: 45, protein: 0.7, carbs: 10, fat: 0.2, fiber: 0.2 },
  { name: "Apple Juice", calories: 46, protein: 0.1, carbs: 11, fat: 0.1, fiber: 0.1 },
  { name: "Mango Juice", calories: 60, protein: 0.3, carbs: 15, fat: 0.1, fiber: 0.3 },
  { name: "Pomegranate Juice", calories: 54, protein: 0.2, carbs: 13, fat: 0.3, fiber: 0.1 },
  { name: "Coconut Water", calories: 19, protein: 0.7, carbs: 4, fat: 0.2, fiber: 1 },
  { name: "Sugarcane Juice", calories: 73, protein: 0.2, carbs: 18, fat: 0, fiber: 0 },
  { name: "Nimbu Pani / Lemonade", calories: 25, protein: 0.1, carbs: 6, fat: 0, fiber: 0 },
  { name: "Masala Chai", calories: 50, protein: 1.5, carbs: 7, fat: 1.8, fiber: 0 },
  { name: "Green Tea", calories: 1, protein: 0, carbs: 0, fat: 0, fiber: 0 },
  { name: "Badam Milk", calories: 110, protein: 5, carbs: 14, fat: 4, fiber: 0.5 },
  { name: "Turmeric Milk / Haldi Doodh", calories: 70, protein: 3.5, carbs: 7, fat: 3.5, fiber: 0 },

  // ===== SWEETS =====
  { name: "Jalebi", calories: 370, protein: 2, carbs: 60, fat: 14, fiber: 0.5 },
  { name: "Gulab Jamun", calories: 325, protein: 5, carbs: 45, fat: 14, fiber: 0.3 },
  { name: "Rasgulla", calories: 186, protein: 5, carbs: 30, fat: 5, fiber: 0 },
  { name: "Kheer", calories: 140, protein: 4, carbs: 22, fat: 4, fiber: 0.3 },
  { name: "Rava Sheera / Halwa", calories: 250, protein: 4, carbs: 35, fat: 11, fiber: 0.5 },
  { name: "Moong Dal Halwa", calories: 300, protein: 6, carbs: 30, fat: 17, fiber: 2 },
  { name: "Besan Ladoo", calories: 430, protein: 8, carbs: 45, fat: 24, fiber: 3 },
  { name: "Mohanthal", calories: 420, protein: 8, carbs: 48, fat: 22, fiber: 2 },
  { name: "Puran Poli", calories: 300, protein: 6, carbs: 50, fat: 9, fiber: 3 },
  { name: "Modak (steamed)", calories: 200, protein: 3, carbs: 35, fat: 6, fiber: 2 },

  // ===== PIZZA (Jain - no onion/garlic) =====
  { name: "Margherita Pizza", calories: 250, protein: 11, carbs: 30, fat: 10, fiber: 1.5 },
  { name: "Cheese Pizza", calories: 270, protein: 12, carbs: 28, fat: 13, fiber: 1 },
  { name: "Paneer Tikka Pizza", calories: 280, protein: 13, carbs: 29, fat: 13, fiber: 1.5 },
  { name: "Corn & Capsicum Pizza", calories: 240, protein: 9, carbs: 32, fat: 9, fiber: 2 },
  { name: "Mushroom Pizza", calories: 245, protein: 10, carbs: 30, fat: 10, fiber: 1.5 },
  { name: "Four Cheese Pizza", calories: 300, protein: 14, carbs: 27, fat: 16, fiber: 1 },
  { name: "Pizza Bread Stick", calories: 280, protein: 8, carbs: 35, fat: 12, fiber: 1 },

  // ===== PASTA & ITALIAN (Jain) =====
  { name: "Penne Arrabiata (Jain)", calories: 180, protein: 6, carbs: 30, fat: 4.5, fiber: 2 },
  { name: "White Sauce Pasta", calories: 220, protein: 7, carbs: 28, fat: 9, fiber: 1.5 },
  { name: "Mac & Cheese", calories: 260, protein: 10, carbs: 30, fat: 12, fiber: 1 },
  { name: "Alfredo Pasta", calories: 240, protein: 8, carbs: 28, fat: 11, fiber: 1 },
  { name: "Pesto Pasta (Jain)", calories: 230, protein: 7, carbs: 28, fat: 10, fiber: 2 },
  { name: "Spaghetti Aglio Olio (Jain)", calories: 200, protein: 6, carbs: 30, fat: 7, fiber: 1.5 },
  { name: "Lasagna (Jain veg)", calories: 210, protein: 9, carbs: 24, fat: 9, fiber: 2 },
  { name: "Gnocchi (Jain)", calories: 190, protein: 5, carbs: 32, fat: 4, fiber: 1.5 },
  { name: "Bruschetta (Jain)", calories: 200, protein: 5, carbs: 25, fat: 9, fiber: 1.5 },
  { name: "Garlic Bread (no garlic, herb butter)", calories: 350, protein: 7, carbs: 40, fat: 18, fiber: 2 },

  // ===== CHINESE / ASIAN (Jain) =====
  { name: "Veg Fried Rice (Jain)", calories: 170, protein: 4, carbs: 28, fat: 5, fiber: 1.5 },
  { name: "Veg Hakka Noodles (Jain)", calories: 180, protein: 4.5, carbs: 30, fat: 5, fiber: 1.5 },
  { name: "Schezwan Noodles (Jain)", calories: 195, protein: 5, carbs: 30, fat: 6, fiber: 1.5 },
  { name: "Manchurian Dry (Jain)", calories: 200, protein: 5, carbs: 22, fat: 10, fiber: 2 },
  { name: "Manchurian Gravy (Jain)", calories: 150, protein: 4, carbs: 18, fat: 7, fiber: 1.5 },
  { name: "Spring Roll (Jain)", calories: 250, protein: 5, carbs: 28, fat: 13, fiber: 2 },
  { name: "Paneer Chilli (Jain)", calories: 220, protein: 12, carbs: 12, fat: 14, fiber: 1 },
  { name: "Sweet Corn Soup", calories: 55, protein: 2, carbs: 10, fat: 0.8, fiber: 1 },
  { name: "Hot & Sour Soup (Jain)", calories: 45, protein: 2, carbs: 7, fat: 1, fiber: 1 },
  { name: "Veg Momos (Jain)", calories: 160, protein: 5, carbs: 22, fat: 5, fiber: 1.5 },
  { name: "Paneer Momos", calories: 200, protein: 9, carbs: 22, fat: 8, fiber: 1 },
  { name: "Crispy Corn", calories: 210, protein: 4, carbs: 25, fat: 10, fiber: 2 },
  { name: "Honey Chilli (Jain veg)", calories: 230, protein: 4, carbs: 30, fat: 10, fiber: 1 },
  { name: "Fried Wonton (Jain)", calories: 280, protein: 5, carbs: 30, fat: 15, fiber: 1 },

  // ===== WESTERN / CONTINENTAL (Jain) =====
  { name: "Grilled Cheese Sandwich", calories: 310, protein: 12, carbs: 28, fat: 17, fiber: 1.5 },
  { name: "Paneer Burger (Jain)", calories: 350, protein: 14, carbs: 35, fat: 17, fiber: 2 },
  { name: "Veggie Burger (Jain)", calories: 300, protein: 10, carbs: 38, fat: 12, fiber: 3 },
  { name: "French Fries", calories: 312, protein: 3.4, carbs: 41, fat: 15, fiber: 3.8 },
  { name: "Hash Browns", calories: 290, protein: 3, carbs: 30, fat: 17, fiber: 2.5 },
  { name: "Cheese Toast", calories: 280, protein: 10, carbs: 28, fat: 14, fiber: 1.5 },
  { name: "Nachos with Cheese", calories: 350, protein: 8, carbs: 38, fat: 18, fiber: 3 },
  { name: "Quesadilla (Jain veg)", calories: 290, protein: 11, carbs: 28, fat: 15, fiber: 2 },
  { name: "Veg Wrap / Burrito (Jain)", calories: 260, protein: 8, carbs: 32, fat: 11, fiber: 3 },
  { name: "Pancakes (plain)", calories: 227, protein: 6, carbs: 33, fat: 8, fiber: 1 },
  { name: "Waffles", calories: 290, protein: 7, carbs: 38, fat: 12, fiber: 1 },
  { name: "Croissant", calories: 406, protein: 8, carbs: 46, fat: 21, fiber: 2.5 },
  { name: "Bread (white, per slice ~30g)", calories: 265, protein: 9, carbs: 49, fat: 3.2, fiber: 2.7 },
  { name: "Bread (brown/whole wheat)", calories: 247, protein: 13, carbs: 41, fat: 3.4, fiber: 7 },
  { name: "Cream of Tomato Soup", calories: 60, protein: 1.5, carbs: 10, fat: 1.5, fiber: 1 },
  { name: "Mushroom Soup", calories: 55, protein: 2, carbs: 6, fat: 2.5, fiber: 1 },
  { name: "Broccoli Cheddar Soup", calories: 90, protein: 4, carbs: 7, fat: 5, fiber: 1.5 },

  // ===== SALADS =====
  { name: "Green Salad (plain)", calories: 15, protein: 1, carbs: 2.5, fat: 0.2, fiber: 1.5 },
  { name: "Caesar Salad (Jain, no crouton)", calories: 90, protein: 4, carbs: 5, fat: 6, fiber: 1.5 },
  { name: "Paneer Salad", calories: 150, protein: 10, carbs: 5, fat: 10, fiber: 2 },
  { name: "Corn Salad", calories: 85, protein: 3, carbs: 15, fat: 2, fiber: 2 },
  { name: "Fruit Salad", calories: 50, protein: 0.5, carbs: 13, fat: 0.2, fiber: 1.5 },
  { name: "Sprout Salad", calories: 55, protein: 4, carbs: 7, fat: 1, fiber: 2.5 },
  { name: "Pasta Salad (Jain)", calories: 160, protein: 5, carbs: 22, fat: 6, fiber: 2 },
  { name: "Couscous Salad", calories: 140, protein: 4.5, carbs: 22, fat: 4, fiber: 2 },
  { name: "Cucumber Raita", calories: 50, protein: 2, carbs: 5, fat: 2, fiber: 0.5 },

  // ===== DESSERTS & BAKERY =====
  { name: "Chocolate Cake", calories: 370, protein: 5, carbs: 50, fat: 17, fiber: 2 },
  { name: "Vanilla Cake", calories: 350, protein: 4, carbs: 52, fat: 14, fiber: 0.5 },
  { name: "Brownie", calories: 400, protein: 5, carbs: 50, fat: 20, fiber: 2 },
  { name: "Chocolate Chip Cookie", calories: 488, protein: 5, carbs: 64, fat: 24, fiber: 2.5 },
  { name: "Ice Cream (vanilla)", calories: 207, protein: 3.5, carbs: 24, fat: 11, fiber: 0 },
  { name: "Ice Cream (chocolate)", calories: 216, protein: 3.8, carbs: 28, fat: 11, fiber: 1.5 },
  { name: "Chocolate Mousse", calories: 230, protein: 4, carbs: 25, fat: 13, fiber: 1 },
  { name: "Tiramisu (Jain)", calories: 280, protein: 5, carbs: 30, fat: 15, fiber: 0.5 },
  { name: "Panna Cotta", calories: 220, protein: 3, carbs: 22, fat: 13, fiber: 0 },
  { name: "Cheesecake", calories: 321, protein: 6, carbs: 26, fat: 22, fiber: 0.5 },
  { name: "Muffin (blueberry)", calories: 350, protein: 5, carbs: 48, fat: 15, fiber: 1.5 },
  { name: "Donut (glazed)", calories: 420, protein: 5, carbs: 50, fat: 22, fiber: 1 },
  { name: "Churros", calories: 380, protein: 4, carbs: 44, fat: 21, fiber: 1 },
  { name: "Fruit Custard", calories: 120, protein: 3, carbs: 18, fat: 4, fiber: 1 },

  // ===== SMOOTHIES & SHAKES =====
  { name: "Banana Smoothie", calories: 90, protein: 3, carbs: 18, fat: 1, fiber: 1.5 },
  { name: "Mango Smoothie", calories: 80, protein: 2, carbs: 18, fat: 0.5, fiber: 1 },
  { name: "Protein Shake (with milk)", calories: 150, protein: 25, carbs: 12, fat: 3, fiber: 0 },
  { name: "Chocolate Milkshake", calories: 160, protein: 5, carbs: 25, fat: 5, fiber: 0.5 },
  { name: "Strawberry Milkshake", calories: 140, protein: 4, carbs: 22, fat: 4, fiber: 0.5 },
  { name: "Cold Coffee", calories: 120, protein: 3, carbs: 18, fat: 4, fiber: 0 },
  { name: "Hot Chocolate", calories: 110, protein: 4, carbs: 18, fat: 3, fiber: 1 },

  // ===== DRY FRUITS (expanded) =====
  { name: "Dried Apricots / Khumani", calories: 241, protein: 3.4, carbs: 63, fat: 0.5, fiber: 7 },
  { name: "Dried Cranberries", calories: 308, protein: 0.1, carbs: 82, fat: 1.4, fiber: 5.7 },
  { name: "Dried Mango", calories: 319, protein: 2.4, carbs: 78, fat: 1.2, fiber: 2.4 },
  { name: "Charoli / Chironji", calories: 656, protein: 19, carbs: 12, fat: 59, fiber: 3.5 },
  { name: "Pine Nuts / Chilgoza", calories: 673, protein: 14, carbs: 13, fat: 68, fiber: 3.7 },
  { name: "Macadamia Nuts", calories: 718, protein: 8, carbs: 14, fat: 76, fiber: 8.6 },
  { name: "Brazil Nuts", calories: 659, protein: 14, carbs: 12, fat: 67, fiber: 7.5 },
  { name: "Hazelnuts", calories: 628, protein: 15, carbs: 17, fat: 61, fiber: 9.7 },
  { name: "Pecans", calories: 691, protein: 9, carbs: 14, fat: 72, fiber: 9.6 },
  { name: "Mixed Dry Fruits", calories: 550, protein: 15, carbs: 30, fat: 42, fiber: 6 },
  { name: "Trail Mix (nuts & dried fruit)", calories: 462, protein: 14, carbs: 44, fat: 29, fiber: 5 },

  // ===== MEXICAN (Jain) =====
  { name: "Bean Taco (Jain)", calories: 210, protein: 8, carbs: 25, fat: 8, fiber: 4 },
  { name: "Cheese Enchilada (Jain)", calories: 280, protein: 10, carbs: 26, fat: 15, fiber: 2 },
  { name: "Guacamole (per 100g)", calories: 160, protein: 2, carbs: 9, fat: 15, fiber: 7 },
  { name: "Refried Beans (Jain)", calories: 100, protein: 6, carbs: 14, fat: 2, fiber: 5 },

  // ===== MISCELLANEOUS =====
  { name: "Honey", calories: 304, protein: 0.3, carbs: 82, fat: 0, fiber: 0 },
  { name: "Jaggery / Gur", calories: 383, protein: 0.4, carbs: 98, fat: 0.1, fiber: 0 },
  { name: "Sugar", calories: 387, protein: 0, carbs: 100, fat: 0, fiber: 0 },
  { name: "Coconut Oil", calories: 862, protein: 0, carbs: 0, fat: 100, fiber: 0 },
  { name: "Olive Oil", calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0 },
  { name: "Soya Milk", calories: 33, protein: 2.9, carbs: 1.8, fat: 1.6, fiber: 0.4 },
  { name: "Tofu", calories: 76, protein: 8, carbs: 1.9, fat: 4.8, fiber: 0.3 },
  { name: "Soya Chunks (dry)", calories: 345, protein: 52, carbs: 33, fat: 0.5, fiber: 13 },
  { name: "Whey Protein (per scoop ~30g)", calories: 400, protein: 80, carbs: 10, fat: 5, fiber: 0 },
  { name: "Hummus (Jain)", calories: 166, protein: 8, carbs: 14, fat: 10, fiber: 6 },
  { name: "Peanut Chikki", calories: 450, protein: 12, carbs: 55, fat: 22, fiber: 3 },
  { name: "Granola", calories: 471, protein: 10, carbs: 64, fat: 20, fiber: 7 },
  { name: "Cornflakes (dry)", calories: 357, protein: 7, carbs: 84, fat: 0.4, fiber: 3 },
  { name: "Muesli", calories: 340, protein: 10, carbs: 56, fat: 8, fiber: 8 },
];

const STORAGE_KEY = "dashboard-nutrition";
const todayKey = () => new Date().toISOString().split("T")[0];

const DEFAULT_GOALS: MacroGoals = { calories: 2000, protein: 80, carbs: 250, fat: 65 };

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

function saveData(data: StoredData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function MacroBar({ label, current, goal, color }: { label: string; current: number; goal: number; color: string }) {
  const pct = Math.min((current / goal) * 100, 100);
  const over = current > goal;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className={over ? "text-destructive font-medium" : "text-foreground"}>
          {Math.round(current)}
          <span className="text-muted-foreground">/{goal}{label === "Calories" ? "" : "g"}</span>
        </span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${over ? "bg-destructive" : ""}`}
          style={{ width: `${pct}%`, backgroundColor: over ? undefined : color }}
        />
      </div>
    </div>
  );
}

const PIE_COLORS = {
  protein: "hsl(200, 60%, 50%)",
  carbs: "hsl(38, 70%, 55%)",
  fat: "hsl(0, 60%, 55%)",
};

function MacroPieChart({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
  const proteinCal = protein * 4;
  const carbsCal = carbs * 4;
  const fatCal = fat * 9;
  const total = proteinCal + carbsCal + fatCal;

  if (total === 0) {
    return (
      <div className="flex items-center justify-center">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-dashed border-border flex items-center justify-center">
          <span className="text-[10px] text-muted-foreground">No data</span>
        </div>
      </div>
    );
  }

  const pPct = (proteinCal / total) * 100;
  const cPct = (carbsCal / total) * 100;
  const fPct = (fatCal / total) * 100;

  const r = 42;
  const cx = 50;
  const cy = 50;
  const circumference = 2 * Math.PI * r;

  const segments = [
    { pct: pPct, color: PIE_COLORS.protein, label: "P" },
    { pct: cPct, color: PIE_COLORS.carbs, label: "C" },
    { pct: fPct, color: PIE_COLORS.fat, label: "F" },
  ];

  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 100 100" className="w-20 h-20 sm:w-24 sm:h-24 -rotate-90">
        {segments.map((seg, i) => {
          const dash = (seg.pct / 100) * circumference;
          const gap = circumference - dash;
          const strokeOffset = -offset;
          offset += dash;
          return (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="12"
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={strokeOffset}
              className="transition-all duration-500"
            />
          );
        })}
      </svg>
      <div className="flex gap-3 text-[10px]">
        <span style={{ color: PIE_COLORS.protein }}>● P {Math.round(pPct)}%</span>
        <span style={{ color: PIE_COLORS.carbs }}>● C {Math.round(cPct)}%</span>
        <span style={{ color: PIE_COLORS.fat }}>● F {Math.round(fPct)}%</span>
      </div>
    </div>
  );
}

export default function NutritionTracker() {
  const [data, setData] = useState<StoredData>(loadData);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [grams, setGrams] = useState("100");
  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [showGoals, setShowGoals] = useState(false);
  const [editGoals, setEditGoals] = useState<MacroGoals>(data.goals);

  useEffect(() => { saveData(data); }, [data]);

  const filtered = search.length > 0
    ? FOODS.filter((f) => f.name.toLowerCase().includes(search.toLowerCase())).slice(0, 8)
    : [];

  const selectFood = (food: FoodItem) => {
    setSelected(food);
    setSearch(food.name);
    setShowDropdown(false);
  };

  const addEntry = () => {
    if (!selected || !grams) return;
    const g = parseFloat(grams);
    if (isNaN(g) || g <= 0) return;
    const entry: LogEntry = { id: Date.now().toString(), food: selected, grams: g };
    setData((prev) => ({ ...prev, log: [...prev.log, entry] }));
    setSearch("");
    setSelected(null);
    setGrams("100");
  };

  const removeEntry = (id: string) => {
    setData((prev) => ({ ...prev, log: prev.log.filter((e) => e.id !== id) }));
  };

  const resetLog = () => {
    setData((prev) => ({ ...prev, log: [] }));
  };

  const handleSaveGoals = () => {
    setData((prev) => ({ ...prev, goals: editGoals }));
    setShowGoals(false);
  };

  const totals = data.log.reduce(
    (acc, entry) => {
      const m = entry.grams / 100;
      return {
        calories: acc.calories + entry.food.calories * m,
        protein: acc.protein + entry.food.protein * m,
        carbs: acc.carbs + entry.food.carbs * m,
        fat: acc.fat + entry.food.fat * m,
        fiber: acc.fiber + entry.food.fiber * m,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );

  return (
    <div className="glass-card p-4 sm:p-5 flex flex-col gap-4" style={{ animation: "fade-in 0.4s ease-out 0.35s forwards", opacity: 0 }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-foreground">🥗 Nutrition Tracker <span className="text-[10px] text-muted-foreground font-normal ml-1">{FOODS.length} foods</span></h2>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => { setShowGoals(!showGoals); setEditGoals(data.goals); }}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
            title="Set macro goals"
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>
          {data.log.length > 0 && (
            <button
              onClick={resetLog}
              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-secondary/60 transition-colors"
              title="Reset daily log"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Goals editor */}
      {showGoals && (
        <div className="bg-secondary/40 rounded-lg p-3 flex flex-col gap-2 animate-fade-in">
          <span className="text-[11px] text-muted-foreground font-medium">Daily Macro Goals</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(["calories", "protein", "carbs", "fat"] as const).map((key) => (
              <div key={key} className="flex flex-col gap-1">
                <label className="text-[10px] text-muted-foreground capitalize">{key}</label>
                <input
                  type="number"
                  value={editGoals[key]}
                  onChange={(e) => setEditGoals({ ...editGoals, [key]: Number(e.target.value) })}
                  className="bg-secondary border border-border/60 rounded-md px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent/40 w-full"
                />
              </div>
            ))}
          </div>
          <button
            onClick={handleSaveGoals}
            className="self-end px-3 py-1 rounded-md bg-accent text-accent-foreground text-[11px] font-medium hover:opacity-90 transition-opacity"
          >
            Save Goals
          </button>
        </div>
      )}

      {/* Macro bars + Pie chart */}
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2 w-full">
          <MacroBar label="Calories" current={totals.calories} goal={data.goals.calories} color="hsl(var(--accent))" />
          <MacroBar label="Protein" current={totals.protein} goal={data.goals.protein} color="hsl(200, 60%, 50%)" />
          <MacroBar label="Carbs" current={totals.carbs} goal={data.goals.carbs} color="hsl(38, 70%, 55%)" />
          <MacroBar label="Fat" current={totals.fat} goal={data.goals.fat} color="hsl(0, 60%, 55%)" />
          <div className="col-span-2 text-[11px] text-muted-foreground">
            Fiber: <span className="text-foreground font-medium">{Math.round(totals.fiber)}g</span>
          </div>
        </div>
        <MacroPieChart protein={totals.protein} carbs={totals.carbs} fat={totals.fat} />
      </div>

      {/* Search + add */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setShowDropdown(true); setSelected(null); }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search food..."
            className="w-full bg-secondary/50 border border-border/60 rounded-lg pl-8 pr-8 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent/40"
          />
          {search && (
            <button onClick={() => { setSearch(""); setSelected(null); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {showDropdown && filtered.length > 0 && !selected && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-xl z-20 py-1 max-h-48 overflow-y-auto">
              {filtered.map((f) => (
                <button
                  key={f.name}
                  onClick={() => selectFood(f)}
                  className="w-full text-left px-3 py-2 text-xs text-foreground hover:bg-secondary/60 transition-colors flex justify-between"
                >
                  <span>{f.name}</span>
                  <span className="text-muted-foreground">{f.calories} cal</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <input
              type="number"
              value={grams}
              onChange={(e) => setGrams(e.target.value)}
              className="w-20 bg-secondary/50 border border-border/60 rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent/40"
              min="1"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">g</span>
          </div>
          <button
            onClick={addEntry}
            disabled={!selected}
            className="p-2 rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Food log */}
      {data.log.length > 0 && (
        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto -mx-1 px-1">
          {data.log.map((entry) => {
            const m = entry.grams / 100;
            return (
              <div key={entry.id} className="group flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg hover:bg-secondary/40 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs text-foreground truncate">{entry.food.name}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{entry.grams}g</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {Math.round(entry.food.calories * m)} cal · {Math.round(entry.food.protein * m)}p · {Math.round(entry.food.carbs * m)}c · {Math.round(entry.food.fat * m)}f
                  </div>
                </div>
                <button
                  onClick={() => removeEntry(entry.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all shrink-0"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {data.log.length === 0 && (
        <p className="text-[11px] text-muted-foreground text-center py-3">Search and add foods to start tracking</p>
      )}
    </div>
  );
}
