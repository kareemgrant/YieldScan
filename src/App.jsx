/* eslint-disable react/no-children-prop */
import React from "react";
import {
	HashRouter as Router,
	Link as RouterLink,
	Route,
	Redirect
} from "react-router-dom";
import {
	Flex,
	useColorMode,
	Box,
	Heading,
	Text,
	Input,
	InputGroup,
	InputRightAddon,
	Spinner,
	Link,
	CircularProgress,
	useDisclosure
} from "@chakra-ui/core";
import { Helmet } from "react-helmet";
import { useDebounce } from "use-debounce";
import amplitude from "amplitude-js";
import { AmplitudeProvider, LogOnChange } from "@amplitude/react-amplitude";
import socketIOClient from "socket.io-client";
import AlertDialogContainer from "./components/LoginFlow/AlertDialogContainer";
import ValidatorTable from "./components/ValidatorTable.jsx";
import HelpCenter from "./components/HelpCenter.jsx";
import ReturnsCalculator from "./components/ReturnsCalculator.jsx";
import ScrollToTop from "./ScrollToTop.jsx";
import ValidatorApp from "./components/validator_components/ValidatorApp.jsx";
import NominatorApp from "./components/nominator_components/NominatorApp.jsx";
import LogEvent from "./components/LogEvent";
import ErrorMessage from "./components/ErrorMessage";
import NavBar from "./components/NavBar.jsx";
import SuggestedValidators from "./components/SuggestedValidators/SuggestedValidators";
import WalletConnect from "./components/WalletConnect/WalletConnect";
import ConfirmationPage from "./components/ConfirmationPage/ConfirmationPage";
import EditValidators from "./components/EditValidators/EditValidators";

const AMPLITUDE_KEY = "1f1699160a46dec6cc7514c14cb5c968";

const currency = "KSM";

function App() {
	// eslint-disable-next-line no-unused-vars
	const { colorMode, toggleColorMode } = useColorMode();
	const [electedInfo, setElectedInfo] = React.useState({});
	const [validatorData, setValidatorData] = React.useState([]);
	const [errorState, setErrorState] = React.useState(false);
	const [validatorTableData, setValidatorTableData] = React.useState([]);
	const [intentionData, setIntentionData] = React.useState([]);
	const [validatorsAndIntentions, setValidatorsAndIntentions] = React.useState(
		[]
	);
	const [maxDailyEarning, setMaxDailyEarning] = React.useState(0);
	const [stakeInput, setStakeInput] = React.useState(1000.0);
	const [stakeAmount] = useDebounce(stakeInput, 500.0);
	const [apiConnected, setApiConnected] = React.useState(false);
	const [isLoaded, setIsLoaded] = React.useState(false);
	const [validators, setValidators] = React.useState([
		{ name: "None", stashId: "", amount: 0, risk: 0.0 }
	]);
	const [suggValidatorsData, setSuggValidatorsData] = React.useState({
		budget: "0",
		expectedReturns: "0"
	});

	const {
		isOpen: isExtensionDialogOpen,
		onOpen: onExtensionDialogOpen,
		onClose: onExtensionDialogClose
	} = useDisclosure();
	const {
		isOpen: isCreateAccountDialogOpen,
		onOpen: onCreateAccountDialogOpen,
		onClose: onCreateAccountDialogClose
	} = useDisclosure();

	const ERA_PER_DAY = 4;
	const calcReward = React.useCallback(() => {
		const data = validatorData.map(validator => {
			const {
				stashId,
				stashIdTruncated,
				name,
				commission,
				totalStake,
				poolReward,
				noOfNominators
			} = validator;
			const userStakeFraction = stakeAmount / (stakeAmount + totalStake);
			const dailyEarning = userStakeFraction * poolReward * ERA_PER_DAY;
			return {
				noOfNominators,
				stashId,
				stashIdTruncated,
				name,
				commission: `${parseFloat(commission)}%`,
				dailyEarning: isNaN(dailyEarning)
					? "Not enough data"
					: `${dailyEarning.toPrecision(10)} KSM`,
				dailyEarningPrecise: isNaN(dailyEarning) ? 0 : dailyEarning
			};
		});
		const earnings = data.map(validator => validator.dailyEarningPrecise);
		setMaxDailyEarning(Math.max(...earnings));
		// console.log("table data", data);
		setValidatorTableData(data);
		if (apiConnected) setIsLoaded(true);
	}, [stakeAmount, validatorData, apiConnected]);

	React.useEffect(() => {
		if (apiConnected) {
			calcReward();
		}
	}, [calcReward, apiConnected]);

	React.useEffect(() => {
		let validatorsInfo =
			suggValidatorsData &&
			suggValidatorsData.validatorsList &&
			suggValidatorsData.validatorsList.reduce((acc, cur) => {
				// TODO: Replace placeholder risk score with actual risk score
				acc.push({
					name: cur.name,
					stashId: cur.stashId,
					amount: parseFloat(suggValidatorsData.budget) / 16,
					risk: "0.22"
				});
				return acc;
			}, []);
		setValidators(validatorsInfo);
	}, [suggValidatorsData]);

	React.useEffect(() => {
		const socket = socketIOClient("https://polka-analytic-api.herokuapp.com/");
		socket.on(
			"initial",
			// eslint-disable-next-line no-shadow
			({ filteredValidatorsList, electedInfo, intentionsData }) => {
				if (intentionsData[0]) {
					setApiConnected(true);
					setValidatorData(filteredValidatorsList);
					setElectedInfo(electedInfo[0]);
					setIntentionData(intentionsData[0].intentions);
					setValidatorsAndIntentions(intentionsData[0].validatorsAndIntentions);
					setValidatorsAndIntentions(intentionsData[0].validatorsAndIntentions);
					setValidatorsAndIntentions(intentionsData[0].validatorsAndIntentions);
				} else {
					setErrorState(true);
				}
			}
		);

		socket.on(
			"onDataChange",
			// eslint-disable-next-line no-shadow
			({ filteredValidatorsList, electedInfo, intentionsData }) => {
				if (intentionsData[0]) {
					setApiConnected(true);
					setValidatorData(filteredValidatorsList);
					setElectedInfo(electedInfo[0]);
					setIntentionData(intentionsData[0].intentions);
					setValidatorsAndIntentions(intentionsData[0].validatorsAndIntentions);
					setValidatorsAndIntentions(intentionsData[0].validatorsAndIntentions);
					setValidatorsAndIntentions(intentionsData[0].validatorsAndIntentions);
				} else {
					setErrorState(true);
				}
			}
		);
	}, []);
	const [click, setClick] = React.useState(false);
	if (errorState) {
		return <ErrorMessage />;
	}

	function handleChildTabEvent(data) {
		setSuggValidatorsData({ ...data });
	}

	function handleButtonClick(data) {
		setClick(data);
	}

	return (
		<AmplitudeProvider
			amplitudeInstance={amplitude.getInstance()}
			apiKey={AMPLITUDE_KEY}
		>
			<Helmet>
				<title>Yield Scan - Analytics for Polkadot Network</title>
				<meta
					name='description'
					content='An analytics platform for the Polkadot Network'
				/>
			</Helmet>
			<LogEvent eventType='Home network-details view' />
			<LogOnChange
				eventType='Expected daily earning from stake (Input Change) : (network-details view)'
				value={stakeInput}
			/>
			<Router>
				<ScrollToTop />
				<Route exact path='/'>
					<Redirect to='/network-details' />
				</Route>
				<NavBar
					onExtensionDialogOpen={onExtensionDialogOpen}
					onCreateAccountDialogOpen={onCreateAccountDialogOpen}
				/>
				<Flex
					className='App'
					maxW='90%'
					justify='center'
					direction='column'
					m='auto'
					pb={8}
					px={{ base: 4, md: 0 }}
				>
					{/* Homepage - Dashboard */}
					<Route exact path='/(|network-details)'>
						{isLoaded && apiConnected ? (
							<>
								<Heading as='h2' size='xl' textAlign='center' mt={16}>
									Put your KSM tokens to work
								</Heading>
								<Text fontSize='2xl' textAlign='center' mb={4}>
									You could be earning{" "}
									<Box as='span' color='brand.900'>
										{maxDailyEarning}
									</Box>{" "}
									KSM daily
								</Text>
								{/* Stake Amount Input */}
								<Flex
									flexDirection='column'
									alignItems='center'
									position='sticky'
									top='0'
									zIndex='999'
									backgroundImage={
										colorMode === "light"
											? "linear-gradient(rgba(255, 255, 255, 1), rgba(255, 255, 255, 1), rgba(255, 255, 255, 1), rgba(255, 255, 255, 0))"
											: "linear-gradient(rgba(26, 32, 44, 1), rgba(26, 32, 44, 1), rgba(26, 32, 44, 1), rgba(26, 32, 44, 0))"
									}
									pt={8}
									pb={12}
								>
									<Text
										mb={2}
										textAlign='center'
										fontSize='md'
										color='gray.500'
									>
										Stake amount (change input to see potential earnings)
									</Text>
									<InputGroup>
										<Input
											placeholder='Stake Amount'
											variant='filled'
											type='number'
											min='0'
											step='0.000000000001'
											max='999999999999999'
											value={stakeInput}
											textAlign='center'
											roundedLeft='2rem'
											onChange={e => {
												setStakeInput(parseFloat(e.target.value));
											}}
										/>
										<InputRightAddon
											children={currency}
											backgroundColor='teal.500'
											roundedRight='2rem'
										/>
									</InputGroup>
								</Flex>
								<Link
									as={RouterLink}
									to='/help-center/guides/how-to-stake'
									color='teal.500'
									textAlign='center'
								>
									How to stake?
								</Link>
								{/* Validator Table */}
								<Text textAlign='center' mt={8} mb={8}>
									Looking for a list of active validators to stake on? Look no
									further!
								</Text>
								<ValidatorTable
									onExtensionDialogOpen={onExtensionDialogOpen}
									onCreateAccountDialogOpen={onCreateAccountDialogOpen}
									colorMode={colorMode}
									dataSource={
										validatorTableData !== undefined ? validatorTableData : []
									}
								/>
							</>
						) : (
							<Box
								display='flex'
								flexDirection='column'
								position='absolute'
								top='50%'
								transform='translateY(-50%)'
								alignSelf='center'
								justifyContent='center'
								textAlign='center'
								mt={-16}
							>
								<CircularProgress
									isIndeterminate
									as='span'
									color='brand'
									size='36px'
									alignSelf='center'
								/>
								<Text mt={4} fontSize='xl' color='gray.500' maxW={300}>
									Rome wasn't built in a day...
									<br />
									But this calculation will be done in a few minutes :)
								</Text>
							</Box>
						)}
					</Route>

					{/* Help Center */}
					<Route path='/returns-calculator'>
						<ReturnsCalculator
							colorMode={colorMode}
							currency={currency}
							validatorData={validatorData}
							onEvent={handleChildTabEvent}
							buttonClick={handleButtonClick}
						/>
					</Route>
					{/* Help Center */}
					<Route path='/help-center'>
						<HelpCenter />
					</Route>
					{/* Suggested Validators */}
					{click === true ? (
						<Route path='/suggested-validators'>
							<SuggestedValidators
								colorMode={colorMode}
								returns={parseFloat(suggValidatorsData.expectedReturns)}
								budget={parseFloat(suggValidatorsData.budget)}
								currency={currency}
								validatorsList={validators}
								click={click}
							/>
						</Route>
					) : (
						<Redirect to='/' />
					)}
					{/* PolkaWallet Connect */}
					<Route path='/wallet-connect'>
						<WalletConnect colorMode={colorMode} />
					</Route>
					{/* Edit Validators */}
					<Route path='/edit-validators'>
						<EditValidators
							colorMode={colorMode}
							currency={currency}
							amount={16.5}
						/>
					</Route>
					{/* Confirmation */}
					<Route path='/confirmation'>
						<ConfirmationPage
							colorMode={colorMode}
							stashOptions={[{ option: "Account Name", value: "AccountID" }]}
							controllerOptions={[
								{ option: "Account Name", value: "AccountID" }
							]}
							riskPreference={0.5}
							fees='10.0 milli'
							eras={4}
							amount={3500}
							currency={currency}
							validatorsList={validators}
						/>
					</Route>
					<Route render={() => <Redirect to='/' />} />
				</Flex>
				{/* Validator specific view */}
				<Route
					path='/kusama/validator/'
					render={props => {
						if (!props.history.location.pathname.split("/")[3]) {
							return (
								<div
									style={{
										display: "grid",
										justifyContent: "center",
										alignItems: "center",
										height: "calc(100vh - 40px)"
									}}
								>
									<p
										style={{
											fontSize: "30px",
											fontWeight: "bold"
										}}
									>
										Oops! URL must include a validator's address
									</p>
								</div>
							);
						}
						return isLoaded && apiConnected ? (
							<ValidatorApp
								colorMode={colorMode}
								electedInfo={electedInfo}
								valtotalinfo={validatorData.map(data => data.stashId)}
								validatorData={validatorData}
								validatorTableData={validatorTableData}
								intentions={intentionData}
								validatorsandintentions={validatorsAndIntentions}
								validatorandintentionloading={!isLoaded}
								isKusama
							/>
						) : (
							<Box
								display='flex'
								flexDirection='column'
								position='absolute'
								top='50%'
								left='50%'
								transform='translate(-50%, -50%)'
								alignSelf='center'
								justifyContent='center'
								textAlign='center'
								mt={-16}
								zIndex={-1}
							>
								<Spinner as='span' size='lg' alignSelf='center' />
								<Text
									mt={4}
									fontSize='xl'
									color='gray.500'
									textAlign='center'
									alignSelf='center'
								>
									Unboxing pure awesomeness...
								</Text>
							</Box>
						);
					}}
				/>
				{/* Nominator specific view */}
				<Route path='/kusama/nominator/'>
					{isLoaded && apiConnected ? (
						<NominatorApp
							colorMode={colorMode}
							electedInfo={electedInfo}
							validatorTableData={validatorTableData}
							valtotalinfo={validatorData.map(data => data.stashId)}
							intentions={intentionData}
							validatorData={validatorData}
							validatorsandintentions={validatorsAndIntentions}
							validatorandintentionloading={!isLoaded}
						/>
					) : (
						<Box
							display='flex'
							flexDirection='column'
							position='absolute'
							top='50%'
							left='50%'
							transform='translate(-50%, -50%)'
							alignSelf='center'
							justifyContent='center'
							textAlign='center'
							mt={-16}
							zIndex={-1}
						>
							<Spinner as='span' size='lg' alignSelf='center' />
							<Text
								mt={4}
								fontSize='xl'
								color='gray.500'
								textAlign='center'
								alignSelf='center'
							>
								Stabilizing the isotopes...
							</Text>
						</Box>
					)}
				</Route>
			</Router>
			<AlertDialogContainer
				isOpen={isExtensionDialogOpen}
				onClose={onExtensionDialogClose}
				title='Polkadot JS Extension Required!'
				body={
					<>
						PolkadotJs extension allows you to manage your polkadot accounts
						outside of dapps. Injects the accounts and allows signs transactions
						for a specific account.
						<div>
							<Link
								href='https://chrome.google.com/webstore/detail/polkadot%7Bjs%7D-extension/mopnmbcafieddcagagdcbnhejhlodfdd?hl=en'
								isExternal
								color='teal.500'
							>
								Add PolkadotJs Extension
							</Link>
						</div>
					</>
				}
			/>
			<AlertDialogContainer
				isOpen={isCreateAccountDialogOpen}
				onClose={onCreateAccountDialogClose}
				title='Create atleast one account from polkadot extension!'
				body={
					<React.Fragment>
						Create atleast one account from PolkadotJs extension for making
						transactions for a specific account.
					</React.Fragment>
				}
			/>
		</AmplitudeProvider>
	);
}

export default App;
