const plans = new Set(['Essentiel', 'Essentiel Plus', 'Essentiel Performance']);
export function validPlan(plan) { return plans.has(plan) ? plan : ''; }
export function messageWithPlan(message, plan, previousPlan = '', en = false) {
  let text = String(message || '');
  const prefix = name => `${en ? 'Plan of interest' : 'Forfait envisagé'} : ${name}`;
  if (validPlan(previousPlan)) {
    const old = prefix(previousPlan);
    if (text === old) text = '';
    else if (text.startsWith(old + '\n\n')) text = text.slice(old.length + 2);
  }
  const next = validPlan(plan);
  if (!next) return text;
  return prefix(next) + (text ? '\n\n' + text : '');
}
