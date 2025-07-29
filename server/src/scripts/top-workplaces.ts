const API_URL = 'http://localhost:3000/shifts';

type Shift = {
  id: number;
  workplaceId: number;
  workerId: number | null;
};

async function fetchData(): Promise<void>{
   try {
    const response = await fetch(API_URL);

    if (!response.ok) {
        throw new Error(`HTTP Error! Status: ${response.status}`);
    }
     const json = await response.json();
    console.log(json);
  } catch (error) {
    console.error('Error fetching data:', error);



   }
}


fetchData();