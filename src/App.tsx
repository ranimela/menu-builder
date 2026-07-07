import React, { useState, useEffect } from 'react';
import { useMealPlanner } from './hooks/useMealPlanner';
import { TargetConfigPanel } from './components/TargetConfigPanel';
import { NutritionalDashboard } from './components/NutritionalDashboard';
import { MealSection } from './components/MealSection';
import { CarbAlternativesTable } from './components/CarbAlternativesTable';
import { CustomFoodModal } from './components/CustomFoodModal';
import { Sparkles, Calendar, Share2, RefreshCw, AlertTriangle, CheckCircle, PlusCircle, ArrowUpCircle } from 'lucide-react';
import { calculateTotals, getNutrition } from './utils/solver';

export const App: React.FC = () => {
  const {
    FOOD_DATABASE,
    activeDay,
    setActiveDay,
    weight,
    setWeight,
    autoSolve,
    setAutoSolve,
    selectedSwaps,
    setSelectedSwaps,
    currentPlan,
    foodMap,
    currentPlanTargets,
    actualTotals,
    solverResult,
    activeMeals,
    handleRatioChange,
    handleAddFoodToMeal,
    handleRemoveFoodFromMeal,
    handleQuantityChange,
    handleToggleLock,
    handleResetDay,
    runSolverTrigger,
    handleAddCustomFood
  } = useMealPlanner();

  const [isCustomFoodOpen, setIsCustomFoodOpen] = useState(false);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);

  // Check for service worker updates
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg) {
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setShowUpdateBanner(true);
                }
              });
            }
          });
        }
      });
    }
  }, []);

  const handleReloadApp = () => {
    window.location.reload();
  };

  // Compute total white rice quantity in current plan
  const totalRiceQuantity = React.useMemo(() => {
    let total = 0;
    for (const meal of activeMeals) {
      for (const food of meal.foods) {
        if (food.foodId === 'white_rice') {
          total += food.quantity;
        }
      }
    }
    return total;
  }, [activeMeals]);

  const handleExportToKeep = () => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    const actProRatio = weight > 0 ? Math.round((actualTotals.protein / weight) * 10) / 10 : 0;
    const actCarbRatio = weight > 0 ? Math.round((actualTotals.carbs / weight) * 10) / 10 : 0;
    const actFatRatio = weight > 0 ? Math.round((actualTotals.fat / weight) * 10) / 10 : 0;

    let text = `# Meal Plan: ${currentPlan.name} (${weight}kg) [${timestamp}]\n\n`;
    text += `Target Macros: ${Math.round(currentPlanTargets.calories)} kcal | ${Math.round(currentPlanTargets.protein)}g P | ${Math.round(currentPlanTargets.carbs)}g C | ${Math.round(currentPlanTargets.fat)}g F\n`;
    text += `Actual Macros: ${Math.round(actualTotals.calories)} kcal | ${Math.round(actualTotals.protein * 10) / 10}g P | ${Math.round(actualTotals.carbs * 10) / 10}g C | ${Math.round(actualTotals.fat * 10) / 10}g F\n`;
    text += `Target Ratios: ${currentPlan.ratios.proteinPerKg.toFixed(1)}g/kg P | ${currentPlan.ratios.carbsPerKg.toFixed(1)}g/kg C | ${currentPlan.ratios.fatPerKg.toFixed(1)}g/kg F\n`;
    text += `Actual Ratios: ${actProRatio.toFixed(1)}g/kg P | ${actCarbRatio.toFixed(1)}g/kg C | ${actFatRatio.toFixed(1)}g/kg F\n\n`;

    text += `## Meals:\n`;
    for (const meal of activeMeals) {
      text += `### ${meal.name}:\n`;
      if (meal.foods.length === 0) {
        text += `  (No items selected)\n`;
      } else {
        for (const item of meal.foods) {
          const food = foodMap.get(item.foodId);
          if (food) {
            const nut = getNutrition(food, item.quantity);
            text += `  - ${food.name}: ${item.quantity}${food.unit} (${Math.round(nut.calories)} kcal, ${Math.round(nut.protein * 10) / 10}g P, ${Math.round(nut.carbs * 10) / 10}g C, ${Math.round(nut.fat * 10) / 10}g F)\n`;
          }
        }
      }
      text += '\n';
    }

    navigator.clipboard.writeText(text).then(() => {
      alert("Meal plan copied to clipboard! Opening Google Keep in a new tab so you can paste it.");
      window.open("https://keep.google.com/#create", "_blank");
    }).catch(err => {
      console.error("Could not copy text: ", err);
    });
  };

  const isOptimal = solverResult.status === 'optimal';

  return (
    <div className="min-h-screen bg-brand-bg text-brand-primary font-sans pb-16">
      {/* SW Update Notification Banner */}
      {showUpdateBanner && (
        <div className="bg-brand-accent text-white px-4 py-2 text-center text-xs font-bold flex items-center justify-center gap-2 sticky top-0 z-50">
          <ArrowUpCircle className="h-4 w-4 animate-bounce" />
          A new version of the app is available.
          <button onClick={handleReloadApp} className="underline cursor-pointer ml-1 hover:text-brand-highlight">
            Click here to refresh and update
          </button>
        </div>
      )}

      <header className="border-b border-brand-border bg-brand-card/90 backdrop-blur-md sticky top-[inherit] z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-brand-accent to-brand-secondary p-2.5 rounded-xl shadow-lg">
              <Sparkles className="h-6 w-6 text-brand-primary animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-brand-primary via-brand-accent to-brand-primary bg-clip-text text-transparent">
                Macro-Constrained Menu Generator
              </h1>
              <p className="text-xs text-slate-500">Calculate targets dynamically from your weight and g/kg ratios</p>
            </div>
          </div>
          
          <div className="flex bg-brand-bg p-1.5 rounded-xl border border-brand-border">
            {(['sun_thu', 'fri', 'sat'] as const).map((dayId) => {
              const isActive = activeDay === dayId;
              const name = dayId === 'sun_thu' ? 'Sun-Thu' : dayId === 'fri' ? 'Friday' : 'Saturday';
              return (
                <button
                  key={dayId}
                  id={`tab-btn-${dayId}`}
                  onClick={() => setActiveDay(dayId)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    isActive 
                      ? 'bg-brand-primary text-white shadow-sm' 
                      : 'text-slate-600 hover:text-brand-primary hover:bg-brand-card'
                  }`}
                >
                  <Calendar className="h-4 w-4" />
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        <TargetConfigPanel
          weight={weight}
          setWeight={setWeight}
          ratios={currentPlan.ratios}
          onRatioChange={handleRatioChange}
        />

        <NutritionalDashboard
          actualTotals={actualTotals}
          targets={currentPlanTargets}
          weight={weight}
          ratios={currentPlan.ratios}
          solverResult={solverResult}
        />

        {/* Solver Control Toolbar */}
        <section className="bg-brand-card border border-brand-border p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-brand-primary">
              <input
                type="checkbox"
                checked={autoSolve}
                onChange={(e) => setAutoSolve(e.target.checked)}
                className="rounded border-brand-border text-brand-accent focus:ring-brand-accent h-4 w-4"
              />
              Auto-Solve Menu
            </label>
            {!autoSolve && (
              <button
                onClick={runSolverTrigger}
                className="bg-brand-accent/10 border border-brand-accent/20 hover:bg-brand-accent hover:text-white text-brand-accent text-xs font-bold px-3 py-1.5 rounded-lg transition"
              >
                Solve Menu Now
              </button>
            )}
            {/* Solver status pill */}
            <div className="flex items-center gap-1.5">
              {isOptimal ? (
                <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                  <CheckCircle className="h-3.5 h-3.5 text-emerald-500" />
                  Optimal Match
                </span>
              ) : (
                <span className="bg-amber-500/10 text-amber-600 border border-amber-500/20 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 animate-pulse">
                  <AlertTriangle className="h-3.5 h-3.5 text-amber-500" />
                  Targets Unreachable
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setIsCustomFoodOpen(true)}
              className="flex items-center gap-1 bg-brand-bg hover:bg-slate-200 border border-brand-border text-xs font-bold px-3 py-1.5 rounded-lg transition"
            >
              <PlusCircle className="h-3.5 w-3.5 text-brand-accent" /> Custom Food
            </button>
            <button
              onClick={handleResetDay}
              className="flex items-center gap-1 bg-brand-bg hover:bg-slate-200 border border-brand-border text-xs font-bold px-3 py-1.5 rounded-lg transition"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Reset Day
            </button>
            <button
              onClick={handleExportToKeep}
              className="flex items-center gap-1 bg-brand-primary text-white hover:bg-brand-primary/95 text-xs font-bold px-3 py-1.5 rounded-lg transition"
            >
              <Share2 className="h-3.5 w-3.5" /> Export to Keep
            </button>
          </div>
        </section>

        {/* Meal configuration sections */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-brand-primary flex items-center gap-2">
              <Calendar className="h-5 w-5 text-brand-secondary" /> Meal Contents Configuration
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {activeMeals.map((meal) => {
              const mealTotals = calculateTotals([meal], FOOD_DATABASE);
              return (
                <MealSection
                  key={meal.id}
                  meal={meal}
                  dayId={activeDay}
                  foodDatabase={FOOD_DATABASE}
                  foodMap={foodMap}
                  onQuantityChange={handleQuantityChange}
                  onToggleLock={handleToggleLock}
                  onRemoveFood={handleRemoveFoodFromMeal}
                  onAddFood={handleAddFoodToMeal}
                  selectedSwaps={selectedSwaps}
                  setSelectedSwaps={setSelectedSwaps}
                  mealTotals={mealTotals}
                />
              );
            })}
          </div>
        </section>

        <CarbAlternativesTable
          totalRiceQuantity={totalRiceQuantity}
          foodMap={foodMap}
        />
      </main>

      {/* Custom Food Adder Modal */}
      {isCustomFoodOpen && (
        <CustomFoodModal
          onClose={() => setIsCustomFoodOpen(false)}
          onSave={handleAddCustomFood}
        />
      )}
    </div>
  );
};

export default App;
