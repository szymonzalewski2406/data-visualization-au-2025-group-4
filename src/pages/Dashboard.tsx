import {FilterOptions} from "../interfaces/FilterOptions";
import {SetStateAction, useEffect, useState} from "react";
import {MatchData} from "../interfaces/MatchData";
import {extractSeasonalOptions, loadAllData} from "../utlis/DatasetMapper";
import {
    Alert,
    AppBar,
    Box,
    Card,
    CardContent,
    Checkbox,
    CircularProgress,
    Container,
    FormControl,
    Grid,
    InputLabel,
    ListItemText,
    MenuItem,
    OutlinedInput,
    Select,
    ThemeProvider,
    Toolbar,
    Typography
} from "@mui/material";
import {Theme} from "../constants/Theme";
import premierLeagueLogo from "../static/images/pl_logo.png"

export default function Dashboard() {
    const [allMatchData, setAllMatchData] = useState<MatchData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [dataLoaded, setDataLoaded] = useState<boolean>(false);
    const [loadingError, setLoadingError] = useState<string | null>(null);

    const [selectedSeason, setSelectedSeason] = useState<string>('');
    const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
    const [selectedReferees, setSelectedReferees] = useState<string[]>([]);

    const [currentFilterOptions, setCurrentFilterOptions] = useState<FilterOptions>({
        seasons: [],
        teams: [],
        referees: [],
    });

    useEffect(() => {
        const fetchAndParseData = async () => {
            try {
                const {allData, initialSeasons} = await loadAllData();

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

    useEffect(() => {
        if (!selectedSeason || allMatchData.length === 0) {
            setCurrentFilterOptions(prev => ({...prev, teams: [], referees: []}));
            return;
        }

        const seasonalData = allMatchData.filter(m => m.season === selectedSeason);
        const {teams, referees} = extractSeasonalOptions(seasonalData);

        setCurrentFilterOptions(prev => ({
            ...prev,
            teams: teams,
            referees: referees,
        }));

        setSelectedTeams([]);
        setSelectedReferees([]);

    }, [selectedSeason, allMatchData]);

    const handleSeasonChange = (event: { target: { value: SetStateAction<string>; }; }) => {
        setSelectedSeason(event.target.value);
    };

    const handleTeamChange = (event: { target: { value: any; }; }) => {
        const { target: { value } } = event;
        setSelectedTeams(typeof value === 'string' ? value.split(',') : value);
    };

    const handleRefereeChange = (event: { target: { value: any; }; }) => {
        const { target: { value } } = event;
        setSelectedReferees(typeof value === 'string' ? value.split(',') : value);
    };

    if (loading) {
        return (
            <Box sx={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <CircularProgress color="primary" />
                <Typography sx={{ ml: 2, color: Theme.palette.primary.main }}>Loading data...</Typography>
            </Box>
        );
    }

    const totalSeasons = currentFilterOptions.seasons.length;
    const totalMatches = allMatchData.length;
    const currentSeasonMatchCount = allMatchData.filter(m => m.season === selectedSeason).length;

    return (
        <ThemeProvider theme={Theme}>
            <Box sx={{ flexGrow: 1, backgroundColor: Theme.palette.background.default, minHeight: '100vh' }}>
                <AppBar position="static" sx={{ bgcolor: Theme.palette.primary.light }}>
                    <Toolbar sx={{ justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box
                                component="img"
                                sx={{ height: 40, mr: 2 }}
                                alt="Premier League Logo"
                                src={premierLeagueLogo}
                            />
                            <Typography
                                variant="h5"
                                sx={{ fontWeight: 'bold', color: Theme.palette.primary.contrastText }}
                            >
                                EPL Referee Influence Analysis
                            </Typography>
                        </Box>
                        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 3 }}>
                            <Typography variant="subtitle1" sx={{ color: 'white' }}>
                                Total Seasons: <Box component="span" sx={{ fontWeight: 'bold', color: Theme.palette.primary.contrastText }}>{totalSeasons}</Box>
                            </Typography>
                            <Typography variant="subtitle1" sx={{ color: 'white' }}>
                                Total Matches Loaded: <Box component="span" sx={{ fontWeight: 'bold', color: Theme.palette.primary.contrastText }}>{totalMatches}</Box>
                            </Typography>
                        </Box>
                    </Toolbar>
                </AppBar>

                <Container maxWidth="xl" sx={{ mt: 3, mb: 3 }}>
                    {loadingError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            Loading error! {loadingError}. Please check your `public/dataset/` files.
                        </Alert>
                    )}
                    {!dataLoaded && !loadingError && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            No data to display. Please ensure CSV files are correctly loaded.
                        </Alert>
                    )}
                </Container>

                {dataLoaded && (
                    <Container maxWidth="xl" sx={{ mt: 3, mb: 3 }}>
                        <Grid container spacing={3} alignItems="center">
                            <Grid sx={{ minWidth: 150 }}>
                                <FormControl fullWidth size="small" variant="outlined">
                                    <InputLabel id="season-select-label">Season</InputLabel>
                                    <Select
                                        labelId="season-select-label"
                                        value={selectedSeason}
                                        label="Season"
                                        onChange={handleSeasonChange}
                                        variant="outlined">
                                        {currentFilterOptions.seasons.map((season) => (
                                            <MenuItem key={season} value={season}>{season}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid sx={{ minWidth: 250 }}>
                                <FormControl fullWidth size="small" variant="outlined" disabled={!selectedSeason}>
                                    <InputLabel id="team-select-label">Teams</InputLabel>
                                    <Select
                                        labelId="team-select-label"
                                        multiple
                                        value={selectedTeams}
                                        onChange={handleTeamChange}
                                        variant="outlined"
                                        input={<OutlinedInput label="Teams" />}
                                        renderValue={(selected) => (selected as string[]).join(', ')}
                                    >
                                        {currentFilterOptions.teams.map((team) => (
                                            <MenuItem key={team} value={team}>
                                                <Checkbox checked={selectedTeams.indexOf(team) > -1} />
                                                <ListItemText primary={team} />
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid sx={{ minWidth: 250 }}>
                                <FormControl fullWidth size="small" variant="outlined" disabled={!selectedSeason}>
                                    <InputLabel id="referee-select-label">Referees</InputLabel>
                                    <Select
                                        labelId="referee-select-label"
                                        multiple
                                        value={selectedReferees}
                                        onChange={handleRefereeChange}
                                        variant="outlined"
                                        input={<OutlinedInput label="Referees" />}
                                        renderValue={(selected) => (selected as string[]).join(', ')}
                                    >
                                        {currentFilterOptions.referees.map((referee) => (
                                            <MenuItem key={referee} value={referee}>
                                                <Checkbox checked={selectedReferees.indexOf(referee) > -1} />
                                                <ListItemText primary={referee} />
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </Container>
                )}

                {dataLoaded && (
                    <Container maxWidth="xl" sx={{ pt: 2, pb: 4 }}>
                        <Card elevation={4} sx={{ borderRadius: 2 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom color="primary">
                                    Referee Performance Heatmap ({selectedSeason})
                                </Typography>
                                <Box
                                    sx={{
                                        height: 500,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: `2px dashed ${Theme.palette.secondary.main}`,
                                        borderRadius: 1,
                                        p: 3,
                                    }}
                                >
                                    <Typography variant="h4" sx={{ color: Theme.palette.primary.main, mb: 1 }}>
                                        {currentSeasonMatchCount} Matches Available
                                    </Typography>
                                    <Typography color="textSecondary" align="center">
                                        **TODO: Implement component to display the Referee vs. Statistic Heatmap.**
                                        <br/>
                                        Current Filters: Teams ({selectedTeams.length}), Referees ({selectedReferees.length})
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Container>
                )}
                <Box
                    component="footer"
                    sx={{
                        py: 3,
                        px: 2,
                        mt: 'auto',
                        backgroundColor: Theme.palette.primary.light,
                        color: 'white',
                        textAlign: 'center',
                        borderTop: `1px solid ${Theme.palette.primary.dark}`
                    }}
                >
                    <Container maxWidth="xl">
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            Data Visualization Course Project - Group 4, Aarhus University 2025
                        </Typography>
                        <Typography variant="caption" color="inherit">
                            EPL Referee Influence Analysis Tool | Data Source: Football-Data.co.uk, https://github.com/datasets/football-datasets
                        </Typography>
                    </Container>
                </Box>
            </Box>
        </ThemeProvider>
    );
}