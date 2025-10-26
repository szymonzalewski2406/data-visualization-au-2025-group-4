import {FilterOptions} from "../interfaces/FilterOptions";
import {useEffect, useState} from "react";
import {RefereeData} from "../interfaces/RefereeData";
import {extractRefereeOptions, loadAllData} from "../utlis/DatasetMapper";
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
    SelectChangeEvent,
    ThemeProvider,
    Toolbar,
    Typography,
    IconButton,
    Menu,
    Theme,
} from "@mui/material";
import {DEFAULT_COMPETITION, COMPETITIONS, CompetitionConfig} from "../interfaces/Competitions";
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';


export default function Dashboard() {
    const [selectedCompetition, setSelectedCompetition] = useState<CompetitionConfig>(DEFAULT_COMPETITION);
    const currentTheme: Theme = selectedCompetition.theme as Theme;

    const [allRefereeData, setAllRefereeData] = useState<(RefereeData & { season: string })[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [dataLoaded, setDataLoaded] = useState<boolean>(false);
    const [loadingError, setLoadingError] = useState<string | null>(null);

    const [selectedSeason, setSelectedSeason] = useState<string>('');
    const [selectedReferees, setSelectedReferees] = useState<string[]>([]);

    const [currentFilterOptions, setCurrentFilterOptions] = useState<FilterOptions>({
        seasons: [],
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
                const {allData, initialSeasons} = await loadAllData(selectedCompetition.dataFolder);

                if (allData.length > 0) {
                    setAllRefereeData(allData);
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
                    setLoadingError(`Could not load statistics for ${selectedCompetition.name}.`);
                    setDataLoaded(false);
                }

            } catch (error: any) {
                setLoadingError(error.message || `Unexpected error loading ${selectedCompetition.name} data.`);
                setDataLoaded(false);
            } finally {
                setLoading(false);
            }
        };

        fetchAndParseData();
    }, [selectedCompetition]);

    useEffect(() => {
        if (!selectedSeason || allRefereeData.length === 0) {
            setCurrentFilterOptions(prev => ({...prev, referees: []}));
            return;
        }

        const seasonalData = allRefereeData.filter(m => m.season === selectedSeason);
        const {referees} = extractRefereeOptions(seasonalData);

        setCurrentFilterOptions(prev => ({
            ...prev,
            referees: referees,
        }));

        setSelectedReferees([]);

    }, [selectedSeason, allRefereeData]);

    const handleCompetitionChange = (competition: CompetitionConfig) => {
        if (competition.id !== selectedCompetition.id) {
            setSelectedCompetition(competition);
        }
        handleMenuClose();
    };

    const handleSeasonChange = (event: SelectChangeEvent<string>) => {
        setSelectedSeason(event.target.value);
    };

    const handleRefereeChange = (event: SelectChangeEvent<string[]>) => {
        const {target: {value}} = event;
        if (value.includes('all')) {
            if (selectedReferees.length === currentFilterOptions.referees.length) {
                setSelectedReferees([]);
            } else {
                setSelectedReferees(currentFilterOptions.referees);
            }
        } else {
            setSelectedReferees(typeof value === 'string' ? value.split(',') : value);
        }
    };

    if (loading) {
        return (
            <Box sx={{height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                <CircularProgress color="primary"/>
                <Typography sx={{
                    ml: 2,
                    color: currentTheme.palette.primary.main
                }}>Loading {selectedCompetition.name} data...</Typography>
            </Box>
        );
    }

    const totalSeasons = currentFilterOptions.seasons.length;
    const totalRecordsLoaded = allRefereeData.length;
    const currentSeasonStatCount = allRefereeData.filter(m => m.season === selectedSeason).length;

    const areAllRefereesSelected = currentFilterOptions.referees.length > 0 && selectedReferees.length === currentFilterOptions.referees.length;

    return (
        <ThemeProvider theme={currentTheme}>
            <Box sx={{flexGrow: 1, backgroundColor: currentTheme.palette.background.default, minHeight: '100vh'}}>
                <AppBar
                    position="static"
                    sx={{
                        bgcolor: currentTheme.palette.primary.light,
                        backgroundImage: currentTheme.custom.appBarBackground,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    <Toolbar sx={{justifyContent: 'space-between'}}>
                        <Box sx={{display: 'flex', alignItems: 'center'}}>
                            <Typography
                                variant="h5"
                                sx={{fontWeight: 'bold', color: currentTheme.palette.primary.contrastText}}
                            >
                                UEFA {selectedCompetition.name} Referee Analysis Tool
                            </Typography>
                        </Box>
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 3}}>
                            <IconButton
                                onClick={handleMenuClick}
                                size="large"
                                sx={{color: currentTheme.palette.primary.contrastText}}
                                aria-controls={open ? 'competition-menu' : undefined}
                                aria-haspopup="true"
                                aria-expanded={open ? 'true' : undefined}
                            >
                                <SportsSoccerIcon/>
                            </IconButton>
                            <Menu
                                anchorEl={anchorEl}
                                id="competition-menu"
                                open={open}
                                onClose={handleMenuClose}
                                onClick={handleMenuClose}
                                PaperProps={{
                                    sx: {width: 200},
                                }}
                            >
                                {COMPETITIONS.map((competition) => (
                                    <MenuItem
                                        key={competition.id}
                                        onClick={() => handleCompetitionChange(competition)}
                                        selected={competition.id === selectedCompetition.id}
                                    >
                                        <Box
                                            component="img"
                                            src={competition.logoPath}
                                            alt={`${competition.name} Logo`}
                                            sx={{height: 20, width: 20, mr: 1}}
                                        />
                                        <ListItemText primary={competition.name}/>
                                    </MenuItem>
                                ))}
                            </Menu>
                            <Box sx={{display: {xs: 'none', md: 'flex'}, gap: 3}}>
                                <Typography variant="subtitle1" sx={{color: 'white'}}>
                                    Total Seasons: <Box component="span" sx={{
                                    fontWeight: 'bold',
                                    color: currentTheme.palette.primary.contrastText
                                }}>{totalSeasons}</Box>
                                </Typography>
                                <Typography variant="subtitle1" sx={{color: 'white'}}>
                                    Total Records Loaded: <Box component="span" sx={{
                                    fontWeight: 'bold',
                                    color: currentTheme.palette.primary.contrastText
                                }}>{totalRecordsLoaded}</Box>
                                </Typography>
                            </Box>
                        </Box>
                    </Toolbar>
                </AppBar>

                <Container maxWidth="xl" sx={{mt: 3, mb: 3}}>
                    {loadingError && (
                        <Alert severity="error" sx={{mb: 2}}>
                            Loading error! {loadingError}. Please check your
                            `public/datasets/{selectedCompetition.dataFolder}/` files.
                        </Alert>
                    )}
                    {!dataLoaded && !loadingError && (
                        <Alert severity="info" sx={{mb: 2}}>
                            No data to display. Please ensure CSV files are correctly loaded
                            for {selectedCompetition.name}.
                        </Alert>
                    )}
                </Container>

                {dataLoaded && (
                    <Container maxWidth="xl" sx={{mt: 3, mb: 3}}>
                        <Grid container spacing={3} alignItems="center">
                            <Grid sx={{minWidth: 150}}>
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
                            <Grid sx={{minWidth: 250}}>
                                <FormControl fullWidth size="small" variant="outlined" disabled={!selectedSeason}>
                                    <InputLabel id="referee-select-label">Referees</InputLabel>
                                    <Select
                                        labelId="referee-select-label"
                                        multiple
                                        value={selectedReferees}
                                        onChange={handleRefereeChange}
                                        variant="outlined"
                                        input={<OutlinedInput label="Referees"/>}
                                        renderValue={(selected) => {
                                            if (areAllRefereesSelected) return 'All referees';
                                            return selected.join(', ');
                                        }}
                                    >
                                        <MenuItem value="all">
                                            <Checkbox checked={areAllRefereesSelected}/>
                                            <ListItemText primary="All referees"/>
                                        </MenuItem>
                                        {currentFilterOptions.referees.map((referee) => (
                                            <MenuItem key={referee} value={referee}>
                                                <Checkbox checked={selectedReferees.indexOf(referee) > -1}/>
                                                <ListItemText primary={referee}/>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </Container>
                )}
                {dataLoaded && (
                    <Container maxWidth="xl" sx={{pt: 2, pb: 4}}>
                        <Card elevation={4} sx={{borderRadius: 2}}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom color="primary">
                                    {selectedCompetition.name} Referee Statistics ({selectedSeason})
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
                                    <Typography variant="h4" sx={{color: currentTheme.palette.primary.main, mb: 1}}>
                                        {currentSeasonStatCount} Records Available
                                    </Typography>
                                    <Typography color="textSecondary" align="center">
                                        **TODO: Implement main chart.**
                                        <br/>
                                        Current Filters: Referees ({selectedReferees.length})
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                        <Card elevation={4} sx={{borderRadius: 2}}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom color="primary">
                                    {selectedCompetition.name} Other chart... ({selectedSeason})
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
                                    <Typography variant="h4" sx={{color: currentTheme.palette.primary.main, mb: 1}}>
                                        {currentSeasonStatCount} Records Available
                                    </Typography>
                                    <Typography color="textSecondary" align="center">
                                        **TODO: Implement other charts if needed.**
                                        <br/>
                                        Current Filters: Referees
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
                        color: 'white',
                        textAlign: 'center',
                        borderTop: `1px solid ${currentTheme.palette.primary.dark || currentTheme.palette.primary.main}`,
                        bgcolor: currentTheme.palette.primary.light,
                        backgroundImage: currentTheme.custom.appBarBackground,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    <Container maxWidth="xl">
                        <Typography variant="body2" sx={{mb: 1}}>
                            Data Visualization Course Project - Group 4, Aarhus University 2025
                        </Typography>
                        <Typography variant="caption" color="inherit">
                            UEFA Competition Referee Analysis Tool | Data Source: transfermarkt.de
                        </Typography>
                    </Container>
                </Box>
            </Box>
        </ThemeProvider>
    );
}
