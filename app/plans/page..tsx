'use client'
import Sidebar from '@/components/Sidebar'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function PlansPage() {
  const [plans, setPlans] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', price: '', duration_days: '', description: '' })

  useEffect(() => { fetchPlans() }, [])

  const fetchPlans = async () => {
    const { data } = await supabase.from('plans').select('*').order('price')
    if (data) setPlans(data)
  }

  const addPlan = async (e: React.FormEvent) => {
    e.preventDefault()
    await supabase.from('plans').insert([{
      name: form.name,
      price: Number(form.price),
      duration_days: Number(form.duration_days),
      description: form.description,
      is_active: true
    }])
    setForm({ name: '', price: '', duration_days: '', description: '' })
    setShowForm(false)
    fetchPlans()
  }

  const deletePlan = async (id: number) => {
    if (!confirm('Delete this plan?')) return
    await supabase.from('plans').delete().eq('id', id)
    fetchPlans()
  }

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">💰 Plans</h1>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm">
            + Add Plan
          </button>
        </div>

        {showForm && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Add New Plan</h2>
            <form onSubmit={addPlan} className="grid grid-cols-2 gap-4">
              {[
                { key: 'name', label: 'Plan Name', placeholder: 'e.g. Monthly' },
                { key: 'price', label: 'Price (₹)', placeholder: 'e.g. 99' },
                { key: 'duration_days', label: 'Duration (Days)', placeholder: 'e.g. 30' },
                { key: 'description', label: 'Description', placeholder: 'e.g. Full access for 30 days' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-sm text-gray-400 mb-1 block">{f.label}</label>
                  <input value={(form as any)[f.key]}
                    onChange={e => setForm({...form, [f.key]: e.target.value})}
                    placeholder={f.placeholder} required
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500" />
                </div>
              ))}
              <div className="col-span-2 flex gap-3">
                <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg text-sm">Add Plan</button>
                <button type="button" onClick={() => setShowForm(false)} className="bg-gray-700 text-white px-6 py-2 rounded-lg text-sm">Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          {plans.map(plan => (
            <div key={plan.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="text-lg font-bold text-white mb-1">{plan.name}</div>
              <div className="text-3xl font-bold text-purple-400 mb-1">₹{plan.price}</div>
              <div className="text-sm text-gray-400 mb-2">{plan.duration_days} days</div>
              <div className="text-xs text-gray-500 mb-4">{plan.description}</div>
              <button onClick={() => deletePlan(plan.id)}
                className="text-xs px-3 py-1 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/50">
                Delete
              </button>
            </div>
          ))}
          {plans.length === 0 && (
            <div className="col-span-3 text-center py-12 text-gray-500">
              <div className="text-4xl mb-3">💰</div>
              <p>No plans yet — Add a plan to get started</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
