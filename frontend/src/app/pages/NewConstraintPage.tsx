import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { useConstraints } from '../context/ConstraintsContext';

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
  const editingConstraint = location.state?.constraint;

  const [formData, setFormData] = useState({
    name: editingConstraint?.name || '',
    type: editingConstraint?.type || 'commission_quantitative',
    value: editingConstraint?.value || 0,
    valueType: editingConstraint?.valueType || 'percentage',
    active: editingConstraint?.active ?? true,
  });

  const [ruleGroups, setRuleGroups] = useState<RuleGroup[]>([
    {
      id: '1',
      logic: 'AND',
      rules: [
        { id: '1-1', field: 'sales', operator: '>', value: '0' },
      ],
    },
  ]);

  const fieldOptions = [
    { value: 'sales', label: 'Ventes' },
    { value: 'deliveries', label: 'Livraisons' },
    { value: 'returns', label: 'Retours' },
    { value: 'target', label: 'Objectif' },
    { value: 'performance', label: 'Performance (%)' },
    { value: 'zone', label: 'Zone' },
    { value: 'role', label: 'Rôle' },
    { value: 'seniority', label: 'Ancienneté (années)' },
  ];

  const operatorOptions = [
    { value: '>', label: 'Supérieur à (>)' },
    { value: '>=', label: 'Supérieur ou égal (≥)' },
    { value: '<', label: 'Inférieur à (<)' },
    { value: '<=', label: 'Inférieur ou égal (≤)' },
    { value: '==', label: 'Égal à (=)' },
    { value: '!=', label: 'Différent de (≠)' },
    { value: 'contains', label: 'Contient' },
  ];

  const addRuleGroup = () => {
    const newGroup: RuleGroup = {
      id: Date.now().toString(),
      logic: 'AND',
      rules: [
        { id: `${Date.now()}-1`, field: 'sales', operator: '>', value: '0' },
      ],
    };
    setRuleGroups([...ruleGroups, newGroup]);
  };

  const removeRuleGroup = (groupId: string) => {
    if (ruleGroups.length > 1) {
      setRuleGroups(ruleGroups.filter(g => g.id !== groupId));
    }
  };

  const toggleGroupLogic = (groupId: string) => {
    setRuleGroups(ruleGroups.map(g => 
      g.id === groupId ? { ...g, logic: g.logic === 'AND' ? 'OR' : 'AND' } : g
    ));
  };

  const addRule = (groupId: string) => {
    setRuleGroups(ruleGroups.map(g => {
      if (g.id === groupId) {
        const newRule: Rule = {
          id: `${groupId}-${Date.now()}`,
          field: 'sales',
          operator: '>',
          value: '0',
        };
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
          rules: g.rules.map(r => 
            r.id === ruleId ? { ...r, [field]: value } : r
          ),
        };
      }
      return g;
    }));
  };

  const handleSave = () => {
    // Construire la chaîne de condition
    const conditionString = ruleGroups.map((group, groupIndex) => {
      const groupCondition = group.rules.map(rule => {
        const fieldLabel = fieldOptions.find(f => f.value === rule.field)?.label || rule.field;
        return `${fieldLabel} ${rule.operator} ${rule.value}`;
      }).join(` ${group.logic} `);
      
      return groupIndex > 0 ? `OR (${groupCondition})` : `(${groupCondition})`;
    }).join(' ');

    const constraintData = {
      ...formData,
      condition: conditionString,
      ruleGroups, // Sauvegarder aussi la structure complète
    };

    // En production, sauvegarder dans la base de données
    console.log('Saving constraint:', constraintData);
    
    // Retourner à la page des contraintes
    if (editingConstraint) {
      updateConstraint(editingConstraint.id, constraintData);
    } else {
      addConstraint(constraintData);
    }
    navigate('/constraints');
  };

  const getFieldLabel = (value: string) => {
    return fieldOptions.find(f => f.value === value)?.label || value;
  };

  const getOperatorLabel = (value: string) => {
    return operatorOptions.find(o => o.value === value)?.label || value;
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {editingConstraint ? 'Modifier la commission quantitative' : 'Nouvelle commission quantitative'}
          </h1>
          <p className="text-gray-600 mt-1">Définir les règles et conditions d'application basées sur le volume reçu</p>
        </div>
        <button
          onClick={() => navigate('/constraints')}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Basic Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Informations de base</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de la contrainte
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  placeholder="Ex: Commission Produit A"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de commission
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                >
                  <option value="commission_quantitative">Commission Quantitative</option>
                  <option value="commission_retour">Commission Retour</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valeur
                  </label>
                  <input
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={formData.valueType}
                    onChange={(e) => setFormData({ ...formData, valueType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  >
                    <option value="percentage">%</option>
                    <option value="fixed">MAD</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, active: !formData.active })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.active ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.active ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <label className="text-sm font-medium text-gray-700">
                  {formData.active ? 'Contrainte active' : 'Contrainte inactive'}
                </label>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl shadow-sm p-6 border border-orange-100">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Aperçu de la condition</h3>
            <div className="text-sm text-gray-700 space-y-2">
              {ruleGroups.map((group, groupIndex) => (
                <div key={group.id}>
                  {groupIndex > 0 && (
                    <div className="text-center my-2">
                      <span className="inline-block px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-bold">
                        OU
                      </span>
                    </div>
                  )}
                  <div className="p-3 bg-white rounded-lg border border-orange-200">
                    {group.rules.map((rule, ruleIndex) => (
                      <div key={rule.id}>
                        {ruleIndex > 0 && (
                          <div className="text-center my-1">
                            <span className="text-xs font-semibold" style={{ color: '#f7a800' }}>
                              {group.logic}
                            </span>
                          </div>
                        )}
                        <div className="font-medium">
                          {getFieldLabel(rule.field)} {rule.operator} {rule.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Rules Builder */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Constructeur de règles</h3>
                <p className="text-sm text-gray-600 mt-1">Créer des conditions complexes avec AND/OR</p>
              </div>
              <button
                onClick={addRuleGroup}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="w-4 h-4" />
                Ajouter groupe OR
              </button>
            </div>

            <div className="space-y-6">
              {ruleGroups.map((group, groupIndex) => (
                <div key={group.id} className="border-2 border-gray-200 rounded-xl p-4">
                  {/* Group Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {groupIndex > 0 && (
                        <span className="inline-block px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-bold">
                          OU
                        </span>
                      )}
                      <span className="font-semibold text-gray-900">
                        Groupe de conditions {groupIndex + 1}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleGroupLogic(group.id)}
                        className="px-3 py-1 text-sm font-semibold rounded-lg transition"
                        style={{ 
                          backgroundColor: '#f7a80020',
                          color: '#f7a800'
                        }}
                      >
                        Opérateur: {group.logic}
                      </button>
                      {ruleGroups.length > 1 && (
                        <button
                          onClick={() => removeRuleGroup(group.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Rules in Group */}
                  <div className="space-y-3">
                    {group.rules.map((rule, ruleIndex) => (
                      <div key={rule.id}>
                        {ruleIndex > 0 && (
                          <div className="flex items-center justify-center my-2">
                            <span className="px-3 py-1 text-sm font-bold rounded-lg" style={{ 
                              backgroundColor: '#f7a80020',
                              color: '#f7a800'
                            }}>
                              {group.logic}
                            </span>
                          </div>
                        )}
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="grid grid-cols-12 gap-3 items-start">
                            {/* Field Select */}
                            <div className="col-span-12 sm:col-span-4">
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Champ
                              </label>
                              <select
                                value={rule.field}
                                onChange={(e) => updateRule(group.id, rule.id, 'field', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                              >
                                {fieldOptions.map(option => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Operator Select */}
                            <div className="col-span-12 sm:col-span-4">
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Opérateur
                              </label>
                              <select
                                value={rule.operator}
                                onChange={(e) => updateRule(group.id, rule.id, 'operator', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                              >
                                {operatorOptions.map(option => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Value Input */}
                            <div className="col-span-10 sm:col-span-3">
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Valeur
                              </label>
                              <input
                                type="text"
                                value={rule.value}
                                onChange={(e) => updateRule(group.id, rule.id, 'value', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                                placeholder="0"
                              />
                            </div>

                            {/* Delete Rule Button */}
                            <div className="col-span-2 sm:col-span-1 flex items-end">
                              {group.rules.length > 1 && (
                                <button
                                  onClick={() => removeRule(group.id, rule.id)}
                                  className="w-full p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                  title="Supprimer la règle"
                                >
                                  <Trash2 className="w-4 h-4 mx-auto" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Rule Button */}
                  <button
                    onClick={() => addRule(group.id)}
                    className="w-full mt-3 px-4 py-2 text-sm border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-orange-500 hover:text-orange-600 transition"
                  >
                    <Plus className="w-4 h-4 inline mr-2" />
                    Ajouter une condition {group.logic}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={!formData.name}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 text-white rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#f7a800' }}
            >
              <Save className="w-5 h-5" />
              {editingConstraint ? 'Enregistrer les modifications' : 'Créer la contrainte'}
            </button>
            <button
              onClick={() => navigate('/constraints')}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}