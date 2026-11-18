export function calcBMI(weightKg, heightCm) {
  const w = Number(weightKg);
  const h = Number(heightCm) / 100;
  if (!w || !h) return null;
  return Math.round((w / (h * h)) * 10) / 10;
}

export function bmiCategory(bmi) {
  if (bmi == null) return null;
  if (bmi < 18.5)
    return { label: 'Underweight', color: '#3b82f6', tone: 'bg-blue-50 text-blue-700',
      advice: 'Focus on nutrient-dense, calorie-rich whole foods and adequate protein. A dietician can help you gain weight healthily.' };
  if (bmi < 25)
    return { label: 'Healthy weight', color: '#16a34a', tone: 'bg-emerald-50 text-emerald-700',
      advice: 'Great work! Keep a balanced plate, stay active and keep tracking to maintain your progress.' };
  if (bmi < 30)
    return { label: 'Overweight', color: '#f59e0b', tone: 'bg-amber-50 text-amber-700',
      advice: 'Small, steady changes — portion control, more fibre and daily movement — make a big difference.' };
  return { label: 'Obese', color: '#ef4444', tone: 'bg-red-50 text-red-700',
    advice: 'A personalised plan from a certified dietician is the safest way to reach a healthier weight.' };
}

export function healthyRange(heightCm) {
  const h = Number(heightCm) / 100;
  if (!h) return null;
  return [Math.round(18.5 * h * h * 10) / 10, Math.round(24.9 * h * h * 10) / 10];
}
