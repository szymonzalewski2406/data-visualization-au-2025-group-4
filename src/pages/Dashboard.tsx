import { useEffect, useMemo, useState } from "react";
import { RefereeData } from "../interfaces/RefereeData";
import {
    extractNationalityOptions,
    extractRefereeOptions,
    loadAllData
} from "../utils/DatasetMapper";
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
    IconButton,
    InputLabel,
    ListItemText,
    Menu,
    MenuItem,
    OutlinedInput,
    Select,
    SelectChangeEvent,
    Theme,
    ThemeProvider,
    Toolbar,
    Typography,
    Stack,
    Slider,
    Switch,
    FormControlLabel,
    Tooltip
} from "@mui/material";
import {
    COMPETITIONS,
    CompetitionConfig,
    DEFAULT_COMPETITION
} from "../interfaces/Competitions";
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { FilterOptions } from "../interfaces/FilterOptions";

import RefereeScatterD3 from '../components/RefereeScatterD3';
import GeoMap from "../components/GeoMap";
import RefereeGroupedBarChartD3 from '../components/RefereeGroupedBarChartD3';

export default function Dashboard() {
    const [selectedCompetition, setSelectedCompetition] = useState<CompetitionConfig>(DEFAULT_COMPETITION);
    const currentTheme: Theme = selectedCompetition.theme as Theme;

    const [allRefereeData, setAllRefereeData] = useState<RefereeData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [dataLoaded, setDataLoaded] = useState<boolean>(false);
    const [loadingError, setLoadingError] = useState<string | null>(null);

    const [selectedSeason, setSelectedSeason] = useState<string>('');
    const [selectedNationality, setSelectedNationality] = useState<string[]>([]);
    const [selectedReferees, setSelectedReferees] = useState<string[]>([]);

    const [ageRange, setAgeRange] = useState<number[]>([20, 60]);
    const [minMaxAge, setMinMaxAge] = useState<number[]>([20, 60]);

    const [appearancesRange, setAppearancesRange] = useState<number[]>([0, 50]);
    const [minMaxAppearances, setMinMaxAppearances] = useState<number[]>([0, 50]);

    const [isAgeChart, setIsAgeChart] = useState<boolean>(false);

    const [filterOptions, setFilterOptions] = useState<FilterOptions>({
        seasons: [],
        nationalities: [],
        referees: [],
    });

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);

    useEffect(() => {
        const fetchAndParseData = async () => {
            setLoading(true);
            setLoadingError(null);
            setDataLoaded(false);

            try {
                const { allData, initialSeasons } = await loadAllData(selectedCompetition.dataFolder);

                if (allData.length > 0) {
                    setAllRefereeData(allData);
                    setFilterOptions(prev => ({ ...prev, seasons: initialSeasons }));

                    const ages = allData.map(r => r.age).filter(a => a > 0);
                    if (ages.length > 0) {
                        const min = Math.min(...ages);
                        const max = Math.max(...ages);
                        setMinMaxAge([min, max]);
                        setAgeRange([min, max]);
                    }

                    const apps = allData.map(r => r.appearances);
                    if (apps.length > 0) {
                        const minApp = Math.min(...apps);
                        const maxApp = Math.max(...apps);
                        setMinMaxAppearances([minApp, maxApp]);
                        setAppearancesRange([minApp, maxApp]);
                    }

                    if (initialSeasons.length > 0) {
                        setSelectedSeason(initialSeasons[0]);
                    }
                    setDataLoaded(true);
                } else {
                    setLoadingError(`Could not load statistics for ${selectedCompetition.name}.`);
                }
            } catch (error: any) {
                setLoadingError(error.message || `Unexpected error.`);
            } finally {
                setLoading(false);
            }
        };

        fetchAndParseData();
    }, [selectedCompetition]);

    useEffect(() => {
        if (!selectedSeason || allRefereeData.length === 0) return;

        const dataInSeason = allRefereeData.filter(r => r.season === selectedSeason);

        const ages = dataInSeason.map(r => r.age).filter(a => a > 0);
        if (ages.length > 0) {
            const min = Math.min(...ages);
            const max = Math.max(...ages);
            if (minMaxAge[0] !== min || minMaxAge[1] !== max) {
                setMinMaxAge([min, max]);
                setAgeRange([Math.max(ageRange[0], min), Math.min(ageRange[1], max)]);
            }
        } else {
            setMinMaxAge([20, 60]);
            setAgeRange([20, 60]);
        }

        const apps = dataInSeason.map(r => r.appearances);
        if (apps.length > 0) {
            const minApp = Math.min(...apps);
            const maxApp = Math.max(...apps);
            if (minMaxAppearances[0] !== minApp || minMaxAppearances[1] !== maxApp) {
                setMinMaxAppearances([minApp, maxApp]);
                setAppearancesRange([Math.max(appearancesRange[0], minApp), Math.min(appearancesRange[1], maxApp)]);
            }
        }

    }, [selectedSeason, allRefereeData]);

    useEffect(() => {
        if (!selectedSeason || allRefereeData.length === 0) return;

        const dataInSeason = allRefereeData.filter(r => r.season === selectedSeason);

        const { nationalities } = extractNationalityOptions(dataInSeason);

        let dataFiltered = dataInSeason;

        if (selectedNationality.length > 0) {
            dataFiltered = dataFiltered.filter(r => selectedNationality.includes(r.nationality));
        }

        dataFiltered = dataFiltered.filter(r => {
            if (r.age > 0 && (r.age < ageRange[0] || r.age > ageRange[1])) return false;
            if (r.appearances < appearancesRange[0] || r.appearances > appearancesRange[1]) return false;
            return true;
        });

        const { referees } = extractRefereeOptions(dataFiltered);

        setFilterOptions(prev => ({
            ...prev,
            nationalities: nationalities,
            referees: referees
        }));

    }, [selectedSeason, selectedNationality, allRefereeData, ageRange, appearancesRange]);


    const handleCompetitionChange = (competition: CompetitionConfig) => {
        if (competition.id !== selectedCompetition.id) {
            setSelectedCompetition(competition);
            setSelectedNationality([]);
            setSelectedReferees([]);
        }
        handleMenuClose();
    };

    const handleSeasonChange = (event: SelectChangeEvent<string>) => {
        setSelectedSeason(event.target.value);
        setSelectedNationality([]);
        setSelectedReferees([]);
    };

    const handleNationalityChange = (event: SelectChangeEvent<string[]>) => {
        const { target: { value } } = event;
        const newVal = typeof value === 'string' ? value.split(',') : value;

        setSelectedNationality(newVal);
        setSelectedReferees([]);
    };

    const handleRefereeChange = (event: SelectChangeEvent<string[]>) => {
        const { target: { value } } = event;
        if (value.includes('all')) {
            setSelectedReferees(
                selectedReferees.length === filterOptions.referees.length ? [] : filterOptions.referees
            );
        } else {
            setSelectedReferees(typeof value === 'string' ? value.split(',') : value);
        }
    };

    const handleAgeChange = (event: Event, newValue: number | number[]) => {
        setAgeRange(newValue as number[]);
    };

    const handleAppearancesChange = (event: Event, newValue: number | number[]) => {
        setAppearancesRange(newValue as number[]);
    };

    const handleChartToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
        setIsAgeChart(event.target.checked);
    };


    const displayedData = useMemo(() => {
        return allRefereeData.filter(r => {
            if (r.season !== selectedSeason) return false;
            if (selectedNationality.length > 0 && !selectedNationality.includes(r.nationality)) return false;
            if (selectedReferees.length > 0 && !selectedReferees.includes(r.name)) return false;

            if (r.age > 0 && (r.age < ageRange[0] || r.age > ageRange[1])) return false;
            if (r.appearances < appearancesRange[0] || r.appearances > appearancesRange[1]) return false;

            return true;
        });
    }, [allRefereeData, selectedSeason, selectedNationality, selectedReferees, ageRange, appearancesRange]);


    if (loading) {
        return (
            <Box sx={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <CircularProgress color="primary" />
                <Typography sx={{ ml: 2 }}>Loading data...</Typography>
            </Box>
        );
    }

    const areAllRefereesSelected = filterOptions.referees.length > 0 && selectedReferees.length === filterOptions.referees.length;

    return (
        <ThemeProvider theme={currentTheme}>
            <Box sx={{ flexGrow: 1, backgroundColor: currentTheme.palette.background.default, minHeight: '100vh' }}>
                <AppBar position="static" sx={{
                    bgcolor: currentTheme.palette.primary.light,
                    backgroundImage: currentTheme.custom.appBarBackground,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}>
                    <Toolbar sx={{ justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#fff' }}>
                                {selectedCompetition.name}
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', alignItems: 'flex-end' }}>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                    Active Filters
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#fff', fontWeight: 'bold' }}>
                                    {selectedSeason} • {selectedNationality.length > 0 ? `${selectedNationality.length} Nations` : 'All Nations'} • {displayedData.length} Records
                                </Typography>
                            </Box>
                            <IconButton
                                onClick={handleMenuClick}
                                size="large"
                                sx={{ color: '#fff' }}
                            >
                                <SportsSoccerIcon />
                            </IconButton>
                            <Menu
                                anchorEl={anchorEl}
                                open={open}
                                onClose={handleMenuClose}
                            >
                                {COMPETITIONS.map((comp) => (
                                    <MenuItem key={comp.id} onClick={() => handleCompetitionChange(comp)} selected={comp.id === selectedCompetition.id}>
                                        <Box component="img" src={comp.logoPath} sx={{ height: 20, width: 20, mr: 1 }} />
                                        <ListItemText primary={comp.name} />
                                    </MenuItem>
                                ))}
                            </Menu>
                        </Box>
                    </Toolbar>
                </AppBar>

                <Container maxWidth="xl" sx={{ mt: 3, mb: 3 }}>
                    {loadingError && <Alert severity="error" sx={{ mb: 2 }}>{loadingError}</Alert>}
                    {!dataLoaded && !loadingError && <Alert severity="info">No data loaded.</Alert>}

                    {dataLoaded && (
                        <>
                            <Card sx={{ mb: 3, p: 2 }}>
                                <Stack
                                    direction={{ xs: 'column', lg: 'row' }}
                                    spacing={3}
                                    alignItems="center"
                                    justifyContent="space-between"
                                >
                                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ flexGrow: 1, width: '100%' }} alignItems="center">
                                        <Box sx={{ minWidth: 150 }}>
                                            <FormControl fullWidth size="small">
                                                <InputLabel>Season</InputLabel>
                                                <Select
                                                    value={selectedSeason}
                                                    label="Season"
                                                    onChange={handleSeasonChange}
                                                >
                                                    {filterOptions.seasons.map((s) => (
                                                        <MenuItem key={s} value={s}>{s}</MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Box>

                                        <Box sx={{ minWidth: 150 }}>
                                            <FormControl fullWidth size="small" disabled={!selectedSeason}>
                                                <InputLabel>Nationality</InputLabel>
                                                <Select
                                                    multiple
                                                    value={selectedNationality}
                                                    onChange={handleNationalityChange}
                                                    input={<OutlinedInput label="Nationality" />}
                                                    renderValue={(selected) => selected.join(', ')}
                                                >
                                                    {filterOptions.nationalities.map((nat) => (
                                                        <MenuItem key={nat} value={nat}>
                                                            <Checkbox checked={selectedNationality.indexOf(nat) > -1} />
                                                            <ListItemText primary={nat} />
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Box>

                                        <Box sx={{ width: 150 }}>
                                            <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
                                                Age: {ageRange[0]} - {ageRange[1]} years
                                            </Typography>
                                            <Slider
                                                value={ageRange}
                                                onChange={handleAgeChange}
                                                valueLabelDisplay="auto"
                                                min={minMaxAge[0]}
                                                max={minMaxAge[1]}
                                                size="small"
                                            />
                                        </Box>

                                        <Box sx={{ width: 150 }}>
                                            <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
                                                Apps: {appearancesRange[0]} - {appearancesRange[1]}
                                            </Typography>
                                            <Slider
                                                value={appearancesRange}
                                                onChange={handleAppearancesChange}
                                                valueLabelDisplay="auto"
                                                min={minMaxAppearances[0]}
                                                max={minMaxAppearances[1]}
                                                size="small"
                                            />
                                        </Box>

                                        <Box sx={{ minWidth: 180, flexGrow: 1 }}>
                                            <FormControl fullWidth size="small" disabled={!selectedSeason}>
                                                <InputLabel>Referees</InputLabel>
                                                <Select
                                                    multiple
                                                    value={selectedReferees}
                                                    onChange={handleRefereeChange}
                                                    input={<OutlinedInput label="Referees" />}
                                                    renderValue={(selected) => areAllRefereesSelected ? 'All referees' : selected.join(', ')}
                                                >
                                                    <MenuItem value="all">
                                                        <Checkbox checked={areAllRefereesSelected} />
                                                        <ListItemText primary="All referees" />
                                                    </MenuItem>
                                                    {filterOptions.referees.map((ref) => (
                                                        <MenuItem key={ref} value={ref}>
                                                            <Checkbox checked={selectedReferees.indexOf(ref) > -1} />
                                                            <ListItemText primary={ref} />
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Box>
                                    </Stack>

                                    <Stack direction="row" alignItems="center" spacing={1} sx={{ flexShrink: 0 }}>
                                        <Typography variant="caption" color="textSecondary">
                                            Displaying <b>{displayedData.length}</b> records
                                        </Typography>
                                        <Tooltip
                                            title={
                                                <Box sx={{ p: 0.5 }}>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                                        Strictness Calculation:
                                                    </Typography>
                                                    <Typography variant="caption" display="block">
                                                        (1×Yellow + 3×2ndYellow + 5×Red + 3×Penalty) / Matches
                                                    </Typography>
                                                </Box>
                                            }
                                            arrow
                                            placement="left"
                                        >
                                            <InfoOutlinedIcon fontSize="small" sx={{ color: 'text.secondary', cursor: 'help', opacity: 0.7 }} />
                                        </Tooltip>
                                    </Stack>
                                </Stack>
                            </Card>

                            <Grid container spacing={3} sx={{ mb: 3 }}>
                                <Grid sx={{ width: '100%', display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
                                    <Box sx={{ flex: 1 }}>
                                        <Card elevation={3} sx={{ height: 550, display: 'flex', flexDirection: 'column' }}>
                                            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>

                                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                                                    <Typography variant="h6" color="primary">
                                                        {isAgeChart ? "Age vs. Strictness Analysis" : "Experience vs. Strictness Analysis"}
                                                    </Typography>

                                                    <FormControlLabel
                                                        control={
                                                            <Switch
                                                                checked={isAgeChart}
                                                                onChange={handleChartToggle}
                                                                color="primary"
                                                                size="small"
                                                            />
                                                        }
                                                        label={<Typography variant="caption">Age Analysis</Typography>}
                                                        labelPlacement="start"
                                                    />
                                                </Stack>

                                                <Box sx={{
                                                    flexGrow: 1,
                                                    width: '100%',
                                                    minHeight: 0,
                                                    position: 'relative'
                                                }}>
                                                    <RefereeScatterD3
                                                        data={displayedData}
                                                        isAgeMode={isAgeChart}
                                                    />
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Box>

                                    <Box sx={{ flex: 1 }}>
                                        <Card elevation={3} sx={{ height: 550, display: 'flex', flexDirection: 'column' }}>
                                            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column'}}>
                                                <Typography variant="h6" color="primary" gutterBottom>
                                                    Geographic Strictness
                                                </Typography>
                                                <Box sx={{
                                                    flexGrow: 1,
                                                    width: '100%',
                                                    minHeight: 0,
                                                    position: 'relative'
                                                }}>
                                                    <GeoMap
                                                        data={displayedData}
                                                    />
                                                </Box>

                                            </CardContent>
                                        </Card>
                                    </Box>
                                </Grid>
                            </Grid>

                            {selectedReferees.length !== 1 && (
                            <Grid container spacing={3} sx={{ mb: 3 }}>
                                <Grid sx={{ width: '100%' }}>
                                    <Card elevation={3}>
                                        <CardContent>
                                            <Typography variant="h6" color="primary" gutterBottom>
                                                Top Referees by Strictness Index
                                            </Typography>
                                            <Box sx={{
                                                height: 300,
                                                border: '2px dashed #ccc',
                                                borderRadius: 2,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                bgcolor: '#fafafa'
                                            }}>
                                                <RefereeGroupedBarChartD3 data={displayedData} />
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                            )}

                            {selectedReferees.length === 1 && (
                                <Grid container spacing={3}>
                                    <Grid sx={{ width: '100%', display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
                                        <Box sx={{ flex: 1 }}>
                                            <Card elevation={3} sx={{ borderTop: `4px solid ${currentTheme.palette.secondary.main}` }}>
                                                <CardContent>
                                                    <Typography variant="h6" gutterBottom>
                                                        Referee Passport: {selectedReferees[0]}
                                                    </Typography>
                                                    <Box sx={{ height: 250, bgcolor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        [ PLACEHOLDER: HEATMAP ]
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Card elevation={3} sx={{ borderTop: `4px solid ${currentTheme.palette.secondary.main}` }}>
                                                <CardContent>
                                                    <Typography variant="h6" gutterBottom>
                                                        Card DNA: {selectedReferees[0]}
                                                    </Typography>
                                                    <Box sx={{ height: 250, bgcolor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        [ PLACEHOLDER: WAFFLE CHART ]
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        </Box>
                                    </Grid>
                                </Grid>
                            )}
                        </>
                    )}
                </Container>

                <Box component="footer" sx={{
                    py: 3, px: 2, mt: 'auto',
                    color: 'white', textAlign: 'center',
                    borderTop: `1px solid ${currentTheme.palette.primary.dark}`,
                    bgcolor: currentTheme.palette.primary.light,
                    backgroundImage: currentTheme.custom.appBarBackground,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}>
                    <Container maxWidth="xl">
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            Data Visualization Course Project - Group 4
                        </Typography>
                        <Typography variant="caption" color="inherit">
                            UEFA Competition Referee Analysis Tool | Aarhus University 2025
                        </Typography>
                    </Container>
                </Box>
            </Box>
        </ThemeProvider>
    );
}