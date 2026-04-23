import { useMemo } from 'react';
import { Users, TrendingUp, DollarSign, Calculator } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useHistory } from '../context/HistoryContext';

export default function DashboardPage() {
  const { history } = useHistory();

  // Calculer les KPI à partir des données réelles
  const kpiData = useMemo(() => {
    if (history.length === 0) {
      return {
        totalCalculations: 0,
        totalSales: 0,
        totalSalaries: 0,
        totalCommissions: 0,
        uniqueEmployees: 0,
      };
    }

    const totalCalculations = history.length;
    const totalSales = history.reduce((sum, h) => sum + h.totalSales, 0);
    const totalSalaries = history.reduce((sum, h) => sum + h.finalSalary, 0);
    const totalCommissions = history.reduce((sum, h) => sum + h.commissions, 0);
    const uniqueEmployees = new Set(history.map(h => h.employeeName)).size;

    return {
      totalCalculations,
      totalSales,
      totalSalaries,
      totalCommissions,
      uniqueEmployees,
    };
  }, [history]);

  // Données mensuelles pour les graphiques
  const monthlyData = useMemo(() => {
    const monthsMap = new Map<string, { sales: number; commissions: number; salaries: number; count: number; date: Date }>();

    history.forEach(h => {
      const date = new Date(h.date);
      const monthKey = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
      
      const existing = monthsMap.get(monthKey) || { sales: 0, commissions: 0, salaries: 0, count: 0, date };
      monthsMap.set(monthKey, {
        sales: existing.sales + h.totalSales,
        commissions: existing.commissions + h.commissions,
        salaries: existing.salaries + h.finalSalary,
        count: existing.count + 1,
        date: existing.date, // Garder la date originale pour le tri
      });
    });

    return Array.from(monthsMap.entries())
      .map(([month, data]) => ({
        month,
        ventes: data.sales,
        commissions: data.commissions,
        salaires: data.salaries,
        calculs: data.count,
        sortDate: data.date, // Date pour le tri
      }))
      .sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime()) // Tri par date réelle
      .slice(-6); // Derniers 6 mois
  }, [history]);

  // Top performers basés sur les données réelles
  const topPerformers = useMemo(() => {
    const employeeMap = new Map<string, {
      name: string;
      role: string;
      totalSales: number;
      totalCommissions: number;
      totalSalary: number;
      count: number;
    }>();

    history.forEach(h => {
      const existing = employeeMap.get(h.employeeName) || {
        name: h.employeeName,
        role: h.employeeRole,
        totalSales: 0,
        totalCommissions: 0,
        totalSalary: 0,
        count: 0,
      };

      employeeMap.set(h.employeeName, {
        name: h.employeeName,
        role: h.employeeRole,
        totalSales: existing.totalSales + h.totalSales,
        totalCommissions: existing.totalCommissions + h.commissions,
        totalSalary: existing.totalSalary + h.finalSalary,
        count: existing.count + 1,
      });
    });

    return Array.from(employeeMap.values())
      .sort((a, b) => b.totalCommissions - a.totalCommissions)
      .slice(0, 5);
  }, [history]);

  // Distribution par rôle
  const roleDistribution = useMemo(() => {
    const roleMap = new Map<string, number>();

    history.forEach(h => {
      roleMap.set(h.employeeRole, (roleMap.get(h.employeeRole) || 0) + 1);
    });

    const colors = ['#f7a800', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444'];
    return Array.from(roleMap.entries()).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length],
    }));
  }, [history]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MAD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Calculs Effectués</p>
              <p className="text-3xl font-bold text-gray-900">{kpiData.totalCalculations}</p>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f7a80020' }}>
              <Calculator className="w-6 h-6" style={{ color: '#f7a800' }} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Ventes</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(kpiData.totalSales)}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Salaires Totaux</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(kpiData.totalSalaries)}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Commissions</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(kpiData.totalCommissions)}</p>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f7a80020' }}>
              <DollarSign className="w-6 h-6" style={{ color: '#f7a800' }} />
            </div>
          </div>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
          <Calculator className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">Aucune donnée disponible</h3>
          <p className="text-gray-600 mb-4">
            Effectuez des calculs dans la page "Calcul" pour voir les statistiques et graphiques s'afficher ici.
          </p>
        </div>
      ) : (
        <>
          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Évolution des ventes */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Évolution des Ventes</h3>
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="ventes" stroke="#3b82f6" strokeWidth={2} name="Ventes" dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-400">
                  Pas assez de données
                </div>
              )}
            </div>

            {/* Évolution des commissions */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Évolution des Commissions</h3>
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Bar dataKey="commissions" fill="#f7a800" name="Commissions" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-400">
                  Pas assez de données
                </div>
              )}
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribution par rôle */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Calculs par Rôle</h3>
              {roleDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={roleDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {roleDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-400">
                  Pas assez de données
                </div>
              )}
            </div>

            {/* Nombre de calculs par période */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Calculs par Période</h3>
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Bar dataKey="calculs" fill="#10b981" name="Nombre de calculs" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-400">
                  Pas assez de données
                </div>
              )}
            </div>
          </div>

          {/* Top Performers */}
          {topPerformers.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Top Performers</h3>
                <p className="text-sm text-gray-600 mt-1">Employés avec les meilleures commissions</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Rang</th>
                      <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Employé</th>
                      <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Rôle</th>
                      <th className="text-right py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Calculs</th>
                      <th className="text-right py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Total Ventes</th>
                      <th className="text-right py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Commissions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {topPerformers.map((performer, index) => (
                      <tr key={performer.name} className="hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full font-bold text-white text-sm"
                            style={{ 
                              backgroundColor: index === 0 ? '#f7a800' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#94a3b8' 
                            }}
                          >
                            {index + 1}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-medium text-gray-900">{performer.name}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {performer.role}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className="font-medium text-gray-900">{performer.count}</span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className="font-semibold text-gray-900">{formatCurrency(performer.totalSales)}</span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className="font-bold" style={{ color: '#f7a800' }}>
                            {formatCurrency(performer.totalCommissions)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-orange-600" />
                <h4 className="font-bold text-orange-900">Employés Uniques</h4>
              </div>
              <p className="text-3xl font-bold text-orange-900">{kpiData.uniqueEmployees}</p>
              <p className="text-sm text-orange-700 mt-1">ayant effectué des calculs</p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h4 className="font-bold text-blue-900">Ventes Moyennes</h4>
              </div>
              <p className="text-3xl font-bold text-blue-900">
                {kpiData.totalCalculations > 0 ? formatCurrency(kpiData.totalSales / kpiData.totalCalculations) : '0 MAD'}
              </p>
              <p className="text-sm text-blue-700 mt-1">par calcul</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <h4 className="font-bold text-green-900">Commission Moyenne</h4>
              </div>
              <p className="text-3xl font-bold text-green-900">
                {kpiData.totalCalculations > 0 ? formatCurrency(kpiData.totalCommissions / kpiData.totalCalculations) : '0 MAD'}
              </p>
              <p className="text-sm text-green-700 mt-1">par calcul</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}