import re

# Read with surrogate escape to handle any raw bytes
with open('src/App.tsx', encoding='utf-8', errors='surrogateescape') as f:
    content = f.read()

START_MARKER = 'STATUS DI'
start_idx = content.find(START_MARKER)
open_div_marker = '<div className="bg-black p-2 border border-gray-700">'
open_pos = content.rfind(open_div_marker, 0, start_idx)

# Find the end: two closing divs that terminate the outer status panel div
close_marker = "                </div>\n\n                <div"
close_pos = content.find(close_marker, start_idx)

if open_pos == -1 or close_pos == -1:
    print(f"FAIL: open_pos={open_pos}, close_pos={close_pos}")
    context = content[start_idx-50:start_idx+500]
    print("Context:", context.encode('ascii', 'replace').decode())
else:
    end_of_old = close_pos + len("                </div>")
    old_section = content[open_pos:end_of_old]
    print("Found section, length:", len(old_section))
    new_section = '''<div className="bg-black p-2 border border-gray-700">
                  <p className="text-gray-500 mb-2">STATUS DI\u00c1RIO</p>
                  <div className="flex flex-col gap-2">
                    {(['on-site', 'remote', 'absent', 'vacation'] as Status[]).map(status => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(selectedEmployee, status)}
                        className={`p-1 border ${selectedEmployee.status === status ? 'border-white bg-white/10' : 'border-gray-600 text-gray-500'}`}
                      >
                        {status === 'vacation' ? 'F\u00c9RIAS' : status.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  {/* HO: date reservation calendar */}
                  {selectedEmployee.status === 'remote' && (
                    <div className="mt-3">
                      <p className="text-sky-400 mb-1">\ud83d\udcc5 Reservar dia de HO</p>
                      <input
                        type="date"
                        className="w-full bg-black border border-sky-800 p-1 text-sky-300 outline-none focus:border-sky-400"
                        onChange={(e) => {
                          const newDate = e.target.value;
                          if (!newDate) return;
                          const [y, m, d] = newDate.split('-');
                          const formatted = `${d}/${m}/${y}`;
                          const currentDates = selectedEmployee.homeOfficeDates || [];
                          if (currentDates.includes(formatted)) return;
                          const conflict = employees
                            .filter(emp => emp.id !== selectedEmployee.id && emp.homeOfficeDates?.includes(formatted))
                            .map(emp => emp.name);
                          if (conflict.length >= 2) {
                            alert(`\u26a0\ufe0f Muita gente! ${conflict.join(' e ')} j\u00e1 reservaram este dia.`);
                            return;
                          }
                          if (conflict.length === 1) {
                            const ok = window.confirm(`${conflict[0]} j\u00e1 reservou este dia. Confirmar mesmo assim?`);
                            if (!ok) return;
                          }
                          updateEmployee({
                            ...selectedEmployee,
                            homeOfficeDates: [...currentDates, formatted],
                            homeOfficeUsedThisMonth: (selectedEmployee.homeOfficeUsedThisMonth || 0) + 1,
                          });
                        }}
                      />
                      {selectedEmployee.homeOfficeDates && selectedEmployee.homeOfficeDates.length > 0 && (
                        <div className="mt-2 flex flex-col gap-1">
                          {selectedEmployee.homeOfficeDates.map((date, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-sky-900/20 border border-sky-800/40 rounded px-2 py-0.5">
                              <span className="font-mono text-sky-300">{date}</span>
                              <button
                                onClick={() => {
                                  const updated = (selectedEmployee.homeOfficeDates || []).filter((_, i) => i !== idx);
                                  updateEmployee({
                                    ...selectedEmployee,
                                    homeOfficeDates: updated,
                                    homeOfficeUsedThisMonth: Math.max(0, (selectedEmployee.homeOfficeUsedThisMonth || 0) - 1),
                                  });
                                }}
                                className="text-red-500 hover:text-red-400 text-xs ml-2"
                              >\u00d7</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Vacation: start + end dates */}
                  {selectedEmployee.status === 'vacation' && (
                    <div className="mt-3 flex flex-col gap-2">
                      <p className="text-yellow-400">\ud83c\udfd6\ufe0f Per\u00edodo de F\u00e9rias</p>
                      <div>
                        <label className="text-gray-600">Sa\u00edda</label>
                        <input
                          type="date"
                          className="w-full bg-black border border-yellow-800 p-1 text-yellow-300 outline-none focus:border-yellow-400"
                          value={selectedEmployee.vacationStart || ''}
                          onChange={(e) => updateEmployee({ ...selectedEmployee, vacationStart: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-gray-600">Volta</label>
                        <input
                          type="date"
                          className="w-full bg-black border border-yellow-800 p-1 text-yellow-300 outline-none focus:border-yellow-400"
                          value={selectedEmployee.vacationEnd || ''}
                          onChange={(e) => updateEmployee({ ...selectedEmployee, vacationEnd: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </div>'''

    new_content = content[:open_pos] + new_section + content[end_of_old:]
    with open('src/App.tsx', 'w', encoding='utf-8', errors='surrogateescape') as f:
        f.write(new_content)
    print("SUCCESS: replaced", len(old_section), "chars with", len(new_section), "chars")
