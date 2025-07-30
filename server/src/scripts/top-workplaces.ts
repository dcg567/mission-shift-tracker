const SHIFT_API_URL = 'http://localhost:3000/shifts';
const WORKPLACE_API_URL = 'http://localhost:3000/workplaces';

type Shift = {
  id: number;
  workplaceId: number;
  workerId: number | null;
  cancelledAt: string | null
};

type WorkPlace = {
    id: number;
    name: string;
    status: number;
}

async function fetchAllShifts(): Promise<Shift[]>{

    let allShifts: Shift[] = [];//this array changes over time we use let -- it starts empty but after each iteration we add new shift data (line 25)
    let nextUrl: string | null = SHIFT_API_URL;//sets first url to fetch as initial shifts API endpoint -- start if pagination, each response will update 
    //nextURl with the next page URL if it exists

    while (nextUrl){ //runs while nextURL is not null
        //Why? it retrieves the data at current url
        const response: Response = await fetch(nextUrl);//makes a request to fetch current page of shifts
        if (!response.ok) throw new Error(`Failed to fetch shifts: ${response}`);
        const json = await response.json();//parse json body of response
        allShifts = allShifts.concat(json.data);//adds current page shift data to allShifts array
        nextUrl = json.links?.next ?? null;//moves to next page or ends if no more pages exist
    }

    return allShifts;
}
// --- If we know the API returns only one page of results, we dont need to update nextURL like above therfore we don't need a loop.
// async function fetchAllShifts(): Promise<Shift[]> {
//   const response = await fetch(SHIFT_API_URL);
//   if (!response.ok) throw new Error(`Failed to fetch shifts: ${response.status}`);
  
//   const json = await response.json();
//   return json.data; // Just return the array of shifts directly
// }


async function fetchActiveWorkplaces(): Promise<Map<number, string>> { //return a map(dictionary) of workplaceId/name
    const response = await fetch(WORKPLACE_API_URL);//call api using fetch
    if (!response.ok) throw new Error(`Failed to fetch workplaces: ${response.status}`);//checks if response is ok if not throws an error
    const json = await response.json();//read body of seponse and parse it as JSON

    const map = new Map<number, string>();//we create a mapt to store active workplaces(keys workplaceId, values workplace name)
    for (const wp of json.data as WorkPlace[]) {//loop over each workplace in the data array
        //filter only active workplaces (status === 1)
        if (wp.status === 1) {
            map.set(wp.id, wp.name);//add workplaceId and name to the map
            
        }
    }
    return map;

}

async function main(): Promise<void> {//main func which fetches data, processes it and prints the results
    try {
        const [shifts, activeWorkplaces] = await Promise.all([//fetch both shifts and worplaces
            fetchAllShifts(),
            fetchActiveWorkplaces()
        ]);

        const shiftCounts: Record<number, number> = {};//store number of completed shifts per workplace ID

        for (const shift of shifts) { //iterate over each shift to determine if it's completed and linked to an active workplace
            const isCompleted = shift.workerId !== null && shift.cancelledAt === null;//shift is completed if it has a worker and is not cancelled
            const isActive = activeWorkplaces.has(shift.workplaceId);

            if (isCompleted && isActive) {
                shiftCounts[shift.workplaceId] = (shiftCounts[shift.workplaceId] || 0) + 1;
            }
        }
        const result = Object.entries(shiftCounts)//transform shiftcounts object into an array of objects with name and shift count
        .map(([workplaceId, count]) => ({
            name: activeWorkplaces.get(Number(workplaceId))!,//get name from map using ID
            shifts: count
        }))
        .sort((a, b) => b.shifts - a.shifts)//descending order by no. of shifts
        .slice(0, 3);//top 3

        // console.log('Active workplaces:', activeWorkplaces);

        //print in req format
        for (const item of result) {
            console.log(`{ name: "${item.name}", shifts: ${item.shifts} }`);    
    }
    }   catch(error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();