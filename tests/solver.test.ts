import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  getNutrition,
  calculateTotals,
  calculateMealTotals,
  getFoodLimits,
  getSwapDetails,
  solveDayMenu,
} from '../src/utils/solver.ts';
import type { FoodItem, Meal } from '../src/types/food.ts';

const foodDbPath = path.resolve(import.meta.dirname, '../foodItems.json');
const foodDb: FoodItem[] = JSON.parse(fs.readFileSync(foodDbPath, 'utf-8'));
const foodMap = new Map(foodDb.map((f) => [f.id, f]));

describe('solver utilities', () => {
  it('enforces min = 0 and max = 99999 in getFoodLimits', () => {
    const salad = foodMap.get('mixed_salad');
    const limits = getFoodLimits('mixed_salad', 'sun_thu', 'omad_meal', salad);
    assert.equal(limits.min, 0);
    assert.equal(limits.max, 99999);
  });

  it('computes nutrition accurately for unit and gram items', () => {
    const riceCake = foodMap.get('rice_cake')!;
    const nut = getNutrition(riceCake, 2);
    assert.equal(Math.round(nut.calories * 10) / 10, 58.6);
    assert.equal(Math.round(nut.carbs * 100) / 100, 12.32);
  });

  it('includes carb swap deltas in calculateMealTotals and solveDayMenu', () => {
    const meal: Meal = {
      id: 'omad_meal',
      name: 'OMAD Meal',
      foods: [
        { foodId: 'chicken_breast', quantity: 250, locked: false },
        { foodId: 'white_rice', quantity: 200, locked: false },
      ],
    };

    const baseTotals = calculateTotals([meal], foodMap);
    const swapDetails = getSwapDetails(meal, 'sweet_potatoes', foodMap);
    assert.ok(swapDetails);

    const swappedTotals = calculateMealTotals(meal, foodMap, 'sweet_potatoes');
    assert.equal(
      Math.round((baseTotals.calories + swapDetails.delta.calories) * 10) / 10,
      Math.round(swappedTotals.calories * 10) / 10
    );

    const targets = { calories: 1600, protein: 150, carbs: 180, fat: 50 };
    const result = solveDayMenu([meal], foodDb, targets, 'sun_thu', 'balanced', {
      omad_meal: 'sweet_potatoes',
    });
    assert.ok(result.optimizedMeals.length === 1);
    assert.ok(!Number.isNaN(result.loss));
  });
});
