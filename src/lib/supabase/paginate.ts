/**
 * PostgREST caps every response at 1000 rows and does so silently — a query
 * that should return 2500 activities just comes back with 1000 and no error.
 * Anything that sums over a whole table (wear calculations, virtual-km totals)
 * has to page explicitly or it quietly under-counts.
 */
const PAGE_SIZE = 1000;

export async function fetchAllRows<T>(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null }>
): Promise<T[]> {
  const rows: T[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data } = await fetchPage(from, from + PAGE_SIZE - 1);
    if (!data || data.length === 0) break;

    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
  }

  return rows;
}
