export type ReportRow = {
    id: string;
    type: string;
    date: string;
    name: string;
    owner: string;
    position: string;
    status: string;
    record: Record<string, unknown>;
};
export const reportGroups = {
    hospitals: 'hospital', pharmacies: 'pharmacy', doctors: 'doctor', branches: 'branch', availabilities: 'availability', events: 'event', trainings: 'training', specialTasks: 'special_task', managerActivities: 'managerActivity'
};
export function normalizeReports(data: Record<string, unknown>): ReportRow[] {
    return Object.entries(reportGroups).flatMap(([group, type]) => Array.isArray(data[group]) ? (data[group] as Record<string, unknown>[]).map((r) => ({
        id: `${type}:${r.id}`, type: type === 'managerActivity' ? String(r.activityType) : type,
        date: String(r.activityDate || r.visitDate || r.lastVisit || r.eventDate || r.trainingDate || r.taskDate || r.createdAt || r.submittedAt || '').slice(0, 10),
        name: String(r.name || r.hospital || r.title || r.eventName || r.trainingTopic || r.activityType || ''),
        owner: String(r.userName || r.rep || ''), position: String(r.userPosition || (type === 'managerActivity' ? '' : 'MR')),
        status: String(r.status || ''), record: r,
    })) : []);
}
export function filterReports(rows: ReportRow[], filters: {
    search: string;
    type: string | string[];
    entity: string | string[];
    owner: string | string[];
    position: string | string[];
    start: string;
    end: string;
    sort: string;
}) {
    const matchesFilter = (actual: string, filterVal: string | string[] | undefined) => {
        if (!filterVal) return true;
        if (Array.isArray(filterVal)) {
            if (filterVal.length === 0) return true;
            return filterVal.includes(actual);
        }
        return actual === filterVal;
    };

    return rows.filter(r => 
        matchesFilter(r.type, filters.type) && 
        matchesFilter(r.name, filters.entity) && 
        matchesFilter(r.owner, filters.owner) && 
        matchesFilter(r.position, filters.position) && 
        (!filters.start || r.date >= filters.start) && 
        (!filters.end || r.date <= filters.end) && 
        (!filters.search || [r.name, r.owner, ...Object.values(r.record).filter(v => typeof v === 'string')].join(' ').toLocaleLowerCase().includes(filters.search.toLocaleLowerCase()))
    ).sort((a, b) => filters.sort === 'name' ? a.name.localeCompare(b.name) : filters.sort === 'oldest' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date));
}
