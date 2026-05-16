import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { useConstraints, Constraint } from '../context/ConstraintsContext';
import { useHistory } from '../context/HistoryContext'; // Import de l'historique

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
  const { addHistoryEntry } = useHistory(); // Hook pour l'historique
  const editingConstraint = location.state?.constraint as Constraint | undefined;

  // Récupération de l'utilisateur connecté (simulé via localStorage)
  const currentUser = localStorage.getItem('userName') || 'Utilisateur';

  const [formData, setFormData] = useState({
    name: editingConstraint?.name || '',
    type: editingConstraint?.type || 'commission_quantitative',
    carte: editingConstraint?.carte || 'Coca Cola',
    value: editingConstraint?.value || 0,
    valueType: editingConstraint?.valueType || 'percentage',
    active: editingConstraint?.active ?? true,
  });

  const [ruleGroups, setRuleGroups] = useState<RuleGroup[]>(
    editingConstraint?.ruleGroups || [
      {
        id: '1',
        logic: 'AND',
        rules: [{ id: '1-1', field: 'sales', operator: '>', value: '0' }],
      },
    ]
  );

  const fieldOptions = [
    { value: 'sales', label: 'Ventes' },
    { value: 'deliveries', label: 'Livraisons' },
    { value: 'returns', label: 'Retours' },
    { value: 'role', label: 'Rôle' },
    { value: 'contract', label: 'Type Contrat' },
    { value: 'target', label: 'Objectif' },
    { value: 'performance', label: 'Performance (%)' },
    { value: 'zone', label: 'Zone' },
  ];

  const operatorOptions = [
    { value: '>', label: 'Supérieur à (>)' },
    { value: '>=', label: 'Supérieur ou égal (≥)' },
    { value: '<', label: 'Inférieur à (<)' },
    { value: '<=', label: 'Inférieur ou égal (≤)' },
    { value: '==', label: 'Égal à (=)' },
    { value: '!=', label: 'Différent de (≠)' },
  ];

  const addRuleGroup = () => {
    const newGroup: RuleGroup = {
      id: Date.now().toString(),
      logic: 'AND',
      rules: [{ id: `${Date.now()}-1`, field: 'sales', operator: '>', value: '0' }],
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
        const newRule: Rule = { id: `${groupId}-${Date.now()}`, field: 'sales', operator: '>', value: '0' };
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
    const conditionString = ruleGroups.map((group, groupIndex) => {
      const groupCondition = group.rules.map(rule => {
        const fieldLabel = fieldOptions.find(f => f.value === rule.field)?.label || rule.field;
        return `${fieldLabel} ${rule.operator} ${rule.value}`;
      }).join(` ${group.logic} `);
      return groupIndex > 0 ? `OR (${groupCondition})` : `(${groupCondition})`;
    }).join(' ');

    const constraintData = { ...formData, condition: conditionString, ruleGroups };

    if (editingConstraint) {
      updateConstraint(editingConstraint.id, constraintData as any);
      
      // Enregistrement de la modification dans l'historique
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
      
      // Enregistrement de la création dans l'historique
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
                          <select value={rule.field} onChange={(e) => updateRule(group.id, rule.id, 'field', e.target.value)} className="w-full p-2 text-sm border rounded-md">
                            {fieldOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                          </select>
                        </div>
                        <div className="col-span-3">
                          <select value={rule.operator} onChange={(e) => updateRule(group.id, rule.id, 'operator', e.target.value)} className="w-full p-2 text-sm border rounded-md">
                            {operatorOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                          </select>
                        </div>
                        <div className="col-span-4">
                          <input type="text" value={rule.value} onChange={(e) => updateRule(group.id, rule.id, 'value', e.target.value)} className="w-full p-2 text-sm border rounded-md" placeholder="Valeur" />
                        </div>
                        <div className="col-span-1 text-right">
                          {group.rules.length > 1 && <button onClick={() => removeRule(group.id, rule.id)} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => addRule(group.id)} className="mt-3 text-xs font-bold text-orange-600 hover:underline">+ Ajouter une condition</button>
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