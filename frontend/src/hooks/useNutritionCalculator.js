import { useState, useMemo } from 'react';

const ACTIVITY_FACTORS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const ACTIVITY_LABELS = {
  sedentary: 'Sedentario (poco o ningún ejercicio)',
  light: 'Ligero (ejercicio 1-3 días/semana)',
  moderate: 'Moderado (ejercicio 3-5 días/semana)',
  active: 'Activo (ejercicio 6-7 días/semana)',
  very_active: 'Muy activo (ejercicio intenso diario)',
};

const MEAL_DISTRIBUTION = {
  breakfast: 0.25,
  morning_snack: 0.10,
  lunch: 0.35,
  afternoon_snack: 0.10,
  dinner: 0.20,
};

export function calculateNutritionRequirements(data) {
  const { weight, height, age, sex, activity } = data;
  
  if (!weight || !height || !age || !sex || !activity) {
    return null;
  }

  let bmr;
  if (sex === 'male') {
    bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
  } else {
    bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
  }

  const tdee = bmr * (ACTIVITY_FACTORS[activity] || 1.2);

  const protein = (tdee * 0.20) / 4;
  const carbs = (tdee * 0.50) / 4;
  const fat = (tdee * 0.30) / 9;

  const meals = Object.entries(MEAL_DISTRIBUTION).map(([moment, percentage]) => ({
    moment,
    calories: tdee * percentage,
    percentage: Math.round(percentage * 100),
  }));

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
    meals,
  };
}

export function useNutritionCalculator() {
  const [formData, setFormData] = useState({
    weight: '',
    height: '',
    age: '',
    sex: 'male',
    activity: 'sedentary',
  });

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const requirements = useMemo(() => calculateNutritionRequirements(formData), [formData]);

  return {
    formData,
    updateField,
    requirements,
    activityLabels: ACTIVITY_LABELS,
    activityFactors: ACTIVITY_FACTORS,
  };
}
