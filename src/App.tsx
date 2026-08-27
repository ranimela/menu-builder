import React, { useState, useEffect } from 'react';
import { useMealPlanner } from './hooks/useMealPlanner';
import { TargetConfigPanel } from './components/TargetConfigPanel';
import { NutritionalDashboard } from './components/NutritionalDashboard';
import { MealSection } from './components/MealSection';
import { CarbAlternativesTable } from './components/CarbAlternativesTable';
import { CustomFoodModal } from './components/CustomFoodModal';
import { ManageCustomFoodsModal } from './components/ManageCustomFoodsModal';
import { ProfileSidebar } from './components/ProfileSidebar';
import { Sparkles, Calendar, Share2, RefreshCw, AlertTriangle, CheckCircle, PlusCircle, ArrowUpCircle, Settings, Users } from 'lucide-react';
import { calculateMealTotals, getNutrition, getSwapDetails } from './utils/solver';

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
    handleAddCustomFood,
    handleRemoveCustomFood,
    customFoods,
    solverFocus,
    setSolverFocus,
    profiles,
    activeProfileId,
    handleCreateProfile,
    handleSelectProfile,
    handleDeleteProfile,
    handleRenameProfile
  } = useMealPlanner();

  const [isCustomFoodOpen, setIsCustomFoodOpen] = useState(false);
  const [isManageFoodsOpen, setIsManageFoodsOpen] = useState(false);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
          const qty = typeof food.quantity === 'number' && !isNaN(food.quantity) ? Math.max(0, food.quantity) : 0;
          total += qty;
        }
      }
    }
    return total;
  }, [activeMeals]);

  const handleExportToKeep = () => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    const safeWeight = typeof weight === 'number' && !isNaN(weight) && weight > 0 ? weight : 0;
    const actProRatio = safeWeight > 0 ? (Math.round((actualTotals.protein / safeWeight) * 10) / 10) || 0 : 0;
    const actCarbRatio = safeWeight > 0 ? (Math.round((actualTotals.carbs / safeWeight) * 10) / 10) || 0 : 0;
    const actFatRatio = safeWeight > 0 ? (Math.round((actualTotals.fat / safeWeight) * 10) / 10) || 0 : 0;

    const safeTargetProRatio = typeof currentPlan?.ratios?.proteinPerKg === 'number' && !isNaN(currentPlan.ratios.proteinPerKg) ? currentPlan.ratios.proteinPerKg : 0;
    const safeTargetCarbRatio = typeof currentPlan?.ratios?.carbsPerKg === 'number' && !isNaN(currentPlan.ratios.carbsPerKg) ? currentPlan.ratios.carbsPerKg : 0;
    const safeTargetFatRatio = typeof currentPlan?.ratios?.fatPerKg === 'number' && !isNaN(currentPlan.ratios.fatPerKg) ? currentPlan.ratios.fatPerKg : 0;

    let text = `# Meal Plan: ${currentPlan.name} (${safeWeight}kg) [${timestamp}]\n\n`;
    text += `Target Macros: ${Math.round(currentPlanTargets.calories)} kcal | ${Math.round(currentPlanTargets.protein * 10) / 10}g P | ${Math.round(currentPlanTargets.carbs * 10) / 10}g C | ${Math.round(currentPlanTargets.fat * 10) / 10}g F\n`;
    text += `Actual Macros: ${Math.round(actualTotals.calories)} kcal | ${Math.round(actualTotals.protein * 10) / 10}g P | ${Math.round(actualTotals.carbs * 10) / 10}g C | ${Math.round(actualTotals.fat * 10) / 10}g F\n`;
    text += `Target Ratios: ${safeTargetProRatio.toFixed(1)}g/kg P | ${safeTargetCarbRatio.toFixed(1)}g/kg C | ${safeTargetFatRatio.toFixed(1)}g/kg F\n`;
    text += `Actual Ratios: ${actProRatio.toFixed(1)}g/kg P | ${actCarbRatio.toFixed(1)}g/kg C | ${actFatRatio.toFixed(1)}g/kg F\n\n`;

    text += `## Meals:\n`;
    for (const meal of activeMeals) {
      text += `### ${meal.name}:\n`;
      if (meal.foods.length === 0) {
        text += `  (No items selected)\n`;
      } else {
        const swapFoodId = selectedSwaps[meal.id];
        const swap = swapFoodId ? getSwapDetails(meal, swapFoodId, foodMap) : null;

        for (const item of meal.foods) {
          const food = foodMap.get(item.foodId);
          if (food) {
            if (swap && item.foodId === 'white_rice') {
              text += `  - ${food.name} [SWAPPED with ${swap.altFood.name} ${swap.roundedQty}${swap.altFood.unit}]: (${Math.round(swap.altNut.calories)} kcal, ${Math.round(swap.altNut.protein * 10) / 10}g P, ${Math.round(swap.altNut.carbs * 10) / 10}g C, ${Math.round(swap.altNut.fat * 10) / 10}g F)\n`;
            } else {
              const nut = getNutrition(food, item.quantity);
              text += `  - ${food.name}: ${item.quantity}${food.unit} (${Math.round(nut.calories)} kcal, ${Math.round(nut.protein * 10) / 10}g P, ${Math.round(nut.carbs * 10) / 10}g C, ${Math.round(nut.fat * 10) / 10}g F)\n`;
            }
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
    <div className="min-h-screen bg-brand-bg text-brand-primary font-sans flex">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:block w-64 shrink-0 h-screen sticky top-0">
        <ProfileSidebar
          profiles={profiles}
          activeProfileId={activeProfileId}
          onSelectProfile={handleSelectProfile}
          onCreateProfile={handleCreateProfile}
          onDeleteProfile={handleDeleteProfile}
          onRenameProfile={handleRenameProfile}
        />
      </aside>

      {/* Sidebar Drawer for Mobile */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-slate-900/40 backdrop-blur-sm">
          <div className="w-64 max-w-xs h-full bg-brand-card shadow-2xl">
            <ProfileSidebar
              profiles={profiles}
              activeProfileId={activeProfileId}
              onSelectProfile={handleSelectProfile}
              onCreateProfile={handleCreateProfile}
              onDeleteProfile={handleDeleteProfile}
              onRenameProfile={handleRenameProfile}
              onCloseMobile={() => setIsSidebarOpen(false)}
            />
          </div>
          {/* Click outside to close */}
          <div className="flex-1" onClick={() => setIsSidebarOpen(false)} />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16">
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
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden p-2 border border-brand-border rounded-xl bg-brand-card hover:bg-brand-bg transition text-brand-primary shrink-0"
                title="Open Profiles"
              >
                <Users className="h-5 w-5" />
              </button>
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
          activeMeals={activeMeals}
          foodDatabase={FOOD_DATABASE}
        />

        {/* Solver Control Toolbar */}
        <section className="bg-brand-card border border-brand-border p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap">
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
            
            {/* Focus Options Selector */}
            <div className="flex items-center gap-2 border-l border-brand-border pl-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Focus:</span>
              <select
                value={solverFocus}
                onChange={(e) => setSolverFocus(e.target.value as 'balanced' | 'protein' | 'calories')}
                className="bg-brand-bg border border-brand-border text-xs font-bold rounded-lg px-2 py-1 outline-none text-brand-primary cursor-pointer"
              >
                <option value="balanced">⚖️ Balanced</option>
                <option value="protein">🥩 Protein Priority</option>
                <option value="calories">🔥 Calorie Priority</option>
              </select>
            </div>

            {/* Solver status pill */}
            <div className="flex items-center gap-1.5 border-l border-brand-border pl-4">
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
            <div className="flex items-center border border-brand-border rounded-lg bg-brand-bg overflow-hidden">
              <button
                onClick={() => setIsCustomFoodOpen(true)}
                className="flex items-center gap-1 hover:bg-slate-200 text-xs font-bold px-3 py-1.5 transition border-r border-brand-border text-brand-accent"
              >
                <PlusCircle className="h-3.5 w-3.5" /> Add Food
              </button>
              <button
                onClick={() => setIsManageFoodsOpen(true)}
                className="flex items-center gap-1 hover:bg-slate-200 text-xs font-bold px-3 py-1.5 transition text-slate-600"
                title="Manage foods list"
              >
                <Settings className="h-3.5 w-3.5" /> Manage
              </button>
            </div>
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
              const mealTotals = calculateMealTotals(meal, foodMap, selectedSwaps[meal.id]);
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

      {/* Custom Food Manager CRUD Modal */}
      {isManageFoodsOpen && (
        <ManageCustomFoodsModal
          onClose={() => setIsManageFoodsOpen(false)}
          customFoods={customFoods}
          onRemove={handleRemoveCustomFood}
        />
      )}
      </div>
    </div>
  );
};

export default App;
