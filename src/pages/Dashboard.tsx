import {FilterOptions} from "../interfaces/FilterOptions";
import {useEffect, useState} from "react";
import {MatchData} from "../interfaces/MatchData";
import {loadAllData} from "../utlis/DatasetMapper";

export default function Dashboard() {
    const [allMatchData, setAllMatchData] = useState<MatchData[]>([]);
    const [loading, setLoading] = useState(true);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [loadingError, setLoadingError] = useState<string | null>(null);

    const [selectedSeason, setSelectedSeason] = useState<string>('');
    const [selectedTeam, setSelectedTeam] = useState<string>('');
    const [selectedReferee, setSelectedReferee] = useState<string>('');

    const [currentFilterOptions, setCurrentFilterOptions] = useState<FilterOptions>({
        seasons: [],
        teams: [],
        referees: [],
    });

    useEffect(() => {
        const fetchAndParseData = async () => {
            try {
                const { allData, initialSeasons } = await loadAllData();

                if (allData.length > 0) {
                    setAllMatchData(allData);

                    setCurrentFilterOptions(prev => ({
                        ...prev,
                        seasons: initialSeasons,
                    }));

                    if (initialSeasons.length > 0) {
                        setSelectedSeason(initialSeasons[0]);
                    }
                    setDataLoaded(true);
                    setLoadingError(null);
                } else {
                    setLoadingError("Could not load matches.");
                    setDataLoaded(false);
                }

            } catch (error: any) {
                setLoadingError(error.message || "Unexpected error.");
                setDataLoaded(false);
            } finally {
                setLoading(false);
            }
        };

        fetchAndParseData();
    }, []);


    if (loading) {
        return <p> Loading data from z public/dataset/... </p>;
    }

    if (loadingError) {
        return <p style={{color: 'red'}}> Loading error! {loadingError} </p>;
    }

    if (!dataLoaded) {
        return <p> No data to display. </p>;
    }

    const currentSeasonMatchCount = allMatchData.filter(m => m.season === selectedSeason).length;

    return (
        <div>
            <p> Hello Dashboard! </p>
            <p> Data loaded successfully! </p>
            <p> Loaded {allMatchData.length} matches from {currentFilterOptions.seasons.length} seasons. </p>
            <p> Currently selected season: {selectedSeason} with {currentSeasonMatchCount} matches </p>
        </div>
    );
}