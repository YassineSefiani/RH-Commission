import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { useConstraints, Constraint } from '../context/ConstraintsContext';
import { useHistory } from '../context/HistoryContext';

interface Rule {
  id: string;
  field: string;
  operator: string;
  value: string;
}

interface RuleGroup {
  id: string;
  logic: 'AND' | 'OR';
  rules: Rule[];
}

export default function NewConstraintPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addConstraint, updateConstraint } = useConstraints();
  const { addHistoryEntry } = useHistory();
  const editingConstraint = location.state?.constraint as Constraint | undefined;

  const currentUser = localStorage.getItem('userName') || 'Utilisateur';

  const [formData, setFormData] = useState({
    name: editingConstraint?.name || '',
    type: editingConstraint?.type || 'commission_quantitative',
    carte: editingConstraint?.carte || 'Coca Cola',
    value: editingConstraint?.value || 0,
    valueType: editingConstraint?.valueType || 'percentage',
    active: editingConstraint?.active ?? true,
  });

  // --- Parseur de condition SQL vers Interface Visuelle ---
  const parseConditionString = (conditionStr: string): RuleGroup[] => {
    if (!conditionStr) return [];
    
    // Sépare les groupes par "OR"
    const groupsRaw = conditionStr.split(/\bOR\b/i);
    
    return groupsRaw.map((groupStr, groupIndex) => {
      // Nettoyer les parenthèses
      const cleanGroupStr = groupStr.replace(/^\s*\(\s*|\s*\)\s*$/g, '').trim();
      
      // Séparer les règles par "AND"
      const rulesRaw = cleanGroupStr.split(/\bAND\b/i);
      
      const rules: Rule[] = rulesRaw.map((ruleStr, ruleIndex) => {
        const cleanRule = ruleStr.trim();
        // Regex pour capturer: CHAMP OPERATEUR VALEUR
        const match = cleanRule.match(/^([a-zA-Z_0-9]+)\s*(>=|<=|!=|==|=|>|<)\s*(.+)$/);
        
        if (match) {
          return {
            id: `parsed-${groupIndex}-${ruleIndex}`,
            field: match[1].toLowerCase(),
            operator: match[2] === '=' ? '==' : match[2],
            value: match[3].replace(/^['"]|['"]$/g, ''), // Enlever les guillemets
          };
        }
        
        return {
          id: `parsed-${groupIndex}-${ruleIndex}`,
          field: 'ca_realise', // fallback
          operator: '>',
          value: '0'
        };
      });

      return {
        id: `group-parsed-${groupIndex}`,
        logic: 'AND',
        rules: rules
      };
    });
  };

  // Initialisation de l'état des règles
  const [ruleGroups, setRuleGroups] = useState<RuleGroup[]>(() => {
    if (editingConstraint?.ruleGroups && editingConstraint.ruleGroups.length > 0) {
      return editingConstraint.ruleGroups;
    }
    if (editingConstraint?.condition) {
      return parseConditionString(editingConstraint.condition);
    }
    return [
      {
        id: '1',
        logic: 'AND',
        rules: [{ id: '1-1', field: 'contrat', operator: '==', value: 'CDI' }],
      }
    ];
  });

  // Mises à jour des options pour coller à votre base de données réelle
  const fieldOptions = [
    { value: 'contrat', label: 'Type de Contrat (CDI/Intérim)' },
    { value: 'jours_travailles', label: 'Jours Travaillés' },
    { value: 'taux_triage', label: 'Taux de Triage (%)' },
    { value: 'taux_retour', label: 'Taux de Retour (%)' },
    { value: 'ca_realise', label: 'Ventes / CA Réalisé' },
    { value: 'volume_distribue', label: 'Volume Distribué' },
    { value: 'role', label: 'Rôle (Livreur / Aide)' },
  ];

  const operatorOptions = [
    { value: '==', label: 'Égal à (==)' },
    { value: '!=', label: 'Différent de (!=)' },
    { value: '>', label: 'Supérieur à (>)' },
    { value: '>=', label: 'Supérieur ou égal (>=)' },
    { value: '<', label: 'Inférieur à (<)' },
    { value: '<=', label: 'Inférieur ou égal (<=)' },
  ];

  const addRuleGroup = () => {
    const newGroup: RuleGroup = {
      id: Date.now().toString(),
      logic: 'AND',
      rules: [{ id: `${Date.now()}-1`, field: 'jours_travailles', operator: '>', value: '0' }],
    };
    setRuleGroups([...ruleGroups, newGroup]);
  };

  const removeRuleGroup = (groupId: string) => {
    if (ruleGroups.length > 1) setRuleGroups(ruleGroups.filter(g => g.id !== groupId));
  };

  const toggleGroupLogic = (groupId: string) => {
    setRuleGroups(ruleGroups.map(g => 
      g.id === groupId ? { ...g, logic: g.logic === 'AND' ? 'OR' : 'AND' } : g
    ));
  };

  const addRule = (groupId: string) => {
    setRuleGroups(ruleGroups.map(g => {
      if (g.id === groupId) {
        const newRule: Rule = { id: `${groupId}-${Date.now()}`, field: 'jours_travailles', operator: '>', value: '0' };
        return { ...g, rules: [...g.rules, newRule] };
      }
      return g;
    }));
  };

  const removeRule = (groupId: string, ruleId: string) => {
    setRuleGroups(ruleGroups.map(g => {
      if (g.id === groupId && g.rules.length > 1) {
        return { ...g, rules: g.rules.filter(r => r.id !== ruleId) };
      }
      return g;
    }));
  };

  const updateRule = (groupId: string, ruleId: string, field: keyof Rule, value: string) => {
    setRuleGroups(ruleGroups.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          rules: g.rules.map(r => r.id === ruleId ? { ...r, [field]: value } : r),
        };
      }
      return g;
    }));
  };

  const handleSave = () => {
    // Reconstruction de la chaîne propre pour l'évaluation backend
    const conditionString = ruleGroups.map((group, groupIndex) => {
      const groupCondition = group.rules.map(rule => {
        let formattedValue = rule.value.trim();
        
        // Détecte automatiquement si la valeur est du texte pur ou un nombre
        // isNaN(Number("CDI")) = true (donc texte) | isNaN(Number("15")) = false (donc nombre)
        const isNumber = !isNaN(Number(formattedValue)) && formattedValue !== '';
        
        if (!isNumber) {
          // Si c'est du texte et qu'il n'y a pas déjà de guillemets, on en ajoute
          if (!formattedValue.startsWith("'") && !formattedValue.startsWith('"')) {
            formattedValue = `'${formattedValue}'`;
          }
        }
        
        // Utilisation stricte des minuscules pour les champs (ex: contrat, jours_travailles)
        return `${rule.field.toLowerCase()} ${rule.operator} ${formattedValue}`;
      }).join(` ${group.logic} `);
      
      // S'il n'y a qu'un seul groupe de conditions, on ne met pas de parenthèses du tout
      if (ruleGroups.length === 1) {
        return groupCondition;
      }
      
      // S'il y a plusieurs groupes (OR), on les enveloppe de parenthèses pour respecter la logique
      return groupIndex > 0 ? `OR (${groupCondition})` : `(${groupCondition})`;
    }).join(' ');

    const constraintData = { ...formData, condition: conditionString, ruleGroups };

    if (editingConstraint) {
      updateConstraint(editingConstraint.id, constraintData as any);
      
      addHistoryEntry({
        constraintId: editingConstraint.id,
        modifiedBy: currentUser,
        modificationDate: new Date().toISOString(),
        oldValue: `${editingConstraint.value}${editingConstraint.valueType === 'percentage' ? '%' : ' MAD'}`,
        newValue: `${formData.value}${formData.valueType === 'percentage' ? '%' : ' MAD'}`,
        changeType: 'UPDATE'
      });
    } else {
      const newId = Date.now().toString();
      addConstraint({ ...constraintData, id: newId } as any);
      
      addHistoryEntry({
        constraintId: newId,
        modifiedBy: currentUser,
        modificationDate: new Date().toISOString(),
        newValue: `${formData.value}${formData.valueType === 'percentage' ? '%' : ' MAD'}`,
        changeType: 'CREATE'
      });
    }
    navigate('/constraints');
  };

  return (
    <div className="abc-page-inner abc-stack-lg">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{editingConstraint ? 'Modifier la règle' : 'Nouvelle règle'}</h1>
          <p className="text-gray-600 mt-1">Éditez les valeurs et conditions d'application</p>
        </div>
        <button onClick={() => navigate('/constraints')} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"><X className="w-6 h-6" /></button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Paramètres</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Carte</label>
                <select value={formData.carte} onChange={(e) => setFormData({...formData, carte: e.target.value as any})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none">
                  <option value="Coca Cola">Coca Cola</option>
                  <option value="Ferrero Rocher">Ferrero Rocher</option>
                  <option value="Wall's">Wall's</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value as any})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none">
                  <option value="commission_quantitative">Commission Quantitative</option>
                  <option value="commission_retour">Commission Retour</option>
                  <option value="commission_triage">Commission Triage</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valeur</label>
                  <input type="number" value={formData.value} onChange={(e) => setFormData({...formData, value: parseFloat(e.target.value) || 0})} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unité</label>
                  <select value={formData.valueType} onChange={(e) => setFormData({...formData, valueType: e.target.value as any})} className="w-full px-4 py-2 border rounded-lg outline-none">
                    <option value="percentage">%</option>
                    <option value="fixed">MAD</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-orange-50 p-6 rounded-xl border border-orange-100">
            <h3 className="font-bold text-orange-900 mb-2 text-sm uppercase">Modifié par :</h3>
            <p className="text-sm text-orange-800 font-medium">{currentUser}</p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Constructeur de conditions</h3>
              <button onClick={addRuleGroup} className="flex items-center gap-2 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"><Plus className="w-4 h-4" /> Ajouter groupe (OR)</button>
            </div>

            <div className="space-y-6">
              {ruleGroups.map((group, groupIndex) => (
                <div key={group.id} className="border-2 border-gray-100 rounded-xl p-5 relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-black text-gray-400">GROUPE {groupIndex + 1}</span>
                      <button onClick={() => toggleGroupLogic(group.id)} className="px-3 py-1 text-xs font-bold bg-orange-100 text-orange-700 rounded-md">Logique: {group.logic}</button>
                    </div>
                    {ruleGroups.length > 1 && <button onClick={() => removeRuleGroup(group.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>}
                  </div>

                  <div className="space-y-3">
                    {group.rules.map((rule) => (
                      <div key={rule.id} className="grid grid-cols-12 gap-3 items-center bg-gray-50 p-3 rounded-lg border">
                        <div className="col-span-4">
                          <select value={rule.field} onChange={(e) => updateRule(group.id, rule.id, 'field', e.target.value)} className="w-full p-2 text-sm border rounded-md uppercase font-semibold text-gray-700">
                            {fieldOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            {/* Option de fallback si le champ n'est pas dans la liste */}
                            {!fieldOptions.find(f => f.value === rule.field) && <option value={rule.field}>{rule.field}</option>}
                          </select>
                        </div>
                        <div className="col-span-3">
                          <select value={rule.operator} onChange={(e) => updateRule(group.id, rule.id, 'operator', e.target.value)} className="w-full p-2 text-sm border rounded-md font-bold">
                            {operatorOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                          </select>
                        </div>
                        <div className="col-span-4">
                          <input type="text" value={rule.value} onChange={(e) => updateRule(group.id, rule.id, 'value', e.target.value)} className="w-full p-2 text-sm border rounded-md" placeholder="Valeur" />
                        </div>
                        <div className="col-span-1 text-right">
                          {group.rules.length > 1 && <button type="button" onClick={() => removeRule(group.id, rule.id)} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => addRule(group.id)} className="mt-3 text-xs font-bold text-orange-600 hover:underline">+ Ajouter une condition</button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button onClick={handleSave} disabled={!formData.name} className="flex-1 flex items-center justify-center gap-2 px-6 py-4 text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50 shadow-lg" style={{ backgroundColor: '#f7a800' }}>
              <Save className="w-5 h-5" /> {editingConstraint ? 'Sauvegarder les modifications' : 'Créer la règle'}
            </button>
            <button onClick={() => navigate('/constraints')} className="px-8 py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition">Annuler</button>
          </div>
        </div>
      </div>
    </div>
  );
}