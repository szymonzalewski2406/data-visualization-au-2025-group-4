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
    Typography,
    IconButton,
    Menu,
    Theme,
} from "@mui/material";
import {DEFAULT_LEAGUE, LEAGUES, LeagueConfig} from "../interfaces/Leagues";
import PublicIcon from '@mui/icons-material/Public';


export default function Dashboard() {
    const [selectedLeague, setSelectedLeague] = useState<LeagueConfig>(DEFAULT_LEAGUE);
    const currentTheme: Theme = selectedLeague.theme as Theme;

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

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    useEffect(() => {
        const fetchAndParseData = async () => {
            setLoading(true);
            setLoadingError(null);
            setDataLoaded(false);

            try {
                const {allData, initialSeasons} = await loadAllData(selectedLeague.dataFolder);

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
                    setLoadingError(`Could not load matches for ${selectedLeague.name}.`);
                    setDataLoaded(false);
                }

            } catch (error: any) {
                setLoadingError(error.message || `Unexpected error loading ${selectedLeague.name} data.`);
                setDataLoaded(false);
            } finally {
                setLoading(false);
            }
        };

        fetchAndParseData();
    }, [selectedLeague]);

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

    const handleLeagueChange = (league: LeagueConfig) => {
        if (league.id !== selectedLeague.id) {
            setSelectedLeague(league);
        }
        handleMenuClose();
    };

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
                <Typography sx={{ ml: 2, color: currentTheme.palette.primary.main }}>Loading {selectedLeague.name} data...</Typography>
            </Box>
        );
    }

    const totalSeasons = currentFilterOptions.seasons.length;
    const totalMatches = allMatchData.length;
    const currentSeasonMatchCount = allMatchData.filter(m => m.season === selectedSeason).length;

    return (
        <ThemeProvider theme={currentTheme}>
            <Box sx={{ flexGrow: 1, backgroundColor: currentTheme.palette.background.default, minHeight: '100vh' }}>
                <AppBar position="static" sx={{ bgcolor: currentTheme.palette.primary.light }}>
                    <Toolbar sx={{ justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box
                                component="img"
                                sx={{ height: 40, mr: 2 }}
                                alt={`${selectedLeague.name} Logo`}
                                src={selectedLeague.logoPath}
                            />
                            <Typography
                                variant="h5"
                                sx={{ fontWeight: 'bold', color: currentTheme.palette.primary.contrastText }}
                            >
                                {selectedLeague.name} Referee Influence Analysis
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <IconButton
                                onClick={handleMenuClick}
                                size="large"
                                sx={{ color: currentTheme.palette.primary.contrastText }}
                                aria-controls={open ? 'league-menu' : undefined}
                                aria-haspopup="true"
                                aria-expanded={open ? 'true' : undefined}
                            >
                                <PublicIcon />
                            </IconButton>
                            <Menu
                                anchorEl={anchorEl}
                                id="league-menu"
                                open={open}
                                onClose={handleMenuClose}
                                onClick={handleMenuClose}
                                PaperProps={{
                                    sx: { width: 200 },
                                }}
                            >
                                {LEAGUES.map((league) => (
                                    <MenuItem
                                        key={league.id}
                                        onClick={() => handleLeagueChange(league)}
                                        selected={league.id === selectedLeague.id}
                                    >
                                        <Box
                                            component="img"
                                            src={league.logoPath}
                                            alt={`${league.name} Logo`}
                                            sx={{ height: 20, width: 20, mr: 1 }}
                                        />
                                        <ListItemText primary={league.name} />
                                    </MenuItem>
                                ))}
                            </Menu>
                            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 3 }}>
                                <Typography variant="subtitle1" sx={{ color: 'white' }}>
                                    Total Seasons: <Box component="span" sx={{ fontWeight: 'bold', color: currentTheme.palette.primary.contrastText }}>{totalSeasons}</Box>
                                </Typography>
                                <Typography variant="subtitle1" sx={{ color: 'white' }}>
                                    Total Matches Loaded: <Box component="span" sx={{ fontWeight: 'bold', color: currentTheme.palette.primary.contrastText }}>{totalMatches}</Box>
                                </Typography>
                            </Box>
                        </Box>
                    </Toolbar>
                </AppBar>

                <Container maxWidth="xl" sx={{ mt: 3, mb: 3 }}>
                    {loadingError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            Loading error! {loadingError}. Please check your `public/datasets/{selectedLeague.dataFolder}/` files.
                        </Alert>
                    )}
                    {!dataLoaded && !loadingError && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            No data to display. Please ensure CSV files are correctly loaded for {selectedLeague.name}.
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
                                    {selectedLeague.name} Referee Performance Heatmap ({selectedSeason})
                                </Typography>
                                <Box
                                    sx={{
                                        height: 500,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: `2px dashed ${currentTheme.palette.secondary.main}`,
                                        borderRadius: 1,
                                        p: 3,
                                    }}
                                >
                                    <Typography variant="h4" sx={{ color: currentTheme.palette.primary.main, mb: 1 }}>
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
                        <Card elevation={4} sx={{ borderRadius: 2 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom color="primary">
                                    {selectedLeague.name} Other chart... ({selectedSeason})
                                </Typography>
                                <Box
                                    sx={{
                                        height: 500,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: `2px dashed ${currentTheme.palette.secondary.main}`,
                                        borderRadius: 1,
                                        p: 3,
                                    }}
                                >
                                    <Typography variant="h4" sx={{ color: currentTheme.palette.primary.main, mb: 1 }}>
                                        {currentSeasonMatchCount} Matches Available
                                    </Typography>
                                    <Typography color="textSecondary" align="center">
                                        **TODO: Implement other charts if needed.**
                                        <br/>
                                        Current Filters: Teams ({selectedTeams.length}), Referees
                                        ({selectedReferees.length})
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
                        backgroundColor: currentTheme.palette.primary.light,
                        color: 'white',
                        textAlign: 'center',
                        borderTop: `1px solid ${currentTheme.palette.primary.dark || currentTheme.palette.primary.main}`
                    }}
                >
                    <Container maxWidth="xl">
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            Data Visualization Course Project - Group 4, Aarhus University 2025
                        </Typography>
                        <Typography variant="caption" color="inherit">
                            Top 5 European Football Leagues Referee Influence Analysis Tool | Data Source: https://github.com/datasets/football-datasets
                        </Typography>
                    </Container>
                </Box>
            </Box>
        </ThemeProvider>
    );
}