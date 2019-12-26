import React from "react";
import { IconButton, Box, Text, Spinner, Flex, Divider,InputGroup,  InputRightAddon, Input, Grid } from "@chakra-ui/core";
import { Stage, Layer, Arc, Line, Rect} from "react-konva";
import { ApiPromise, WsProvider } from "@polkadot/api";
import WhiteCircles from "./WhiteCircles";
import { withRouter } from "react-router-dom";
import { hexToString } from "@polkadot/util";

class ValidatorApp extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			validator: props.history.location.pathname.split("/")[3].toString(),
			// validatorsandintentions: props.validatorsandintentions,
			nominators: [],
			showValidatorAddress: false,
			stash: "",
			controller: "",
			name: "",
			isloading: true,
			totalinfo: [],
			valinfo: {},
			validatorInfo: "",
			copied: false,
			isLoaded: false,
			stakeInput: props.maxDailyEarning === -Infinity ? 0 : 1000,
			currentValidatorData: props.validatorData.filter(data => data.stashId === props.history.location.pathname.split("/")[3].toString())[0],
			dailyEarning: props.maxDailyEarning === -Infinity ? 0 : props.maxDailyEarning,
		};
		this.pathArray = window.location.href.split("/");
		this.ismounted = false;
		this.totalvalue = 0;
		this.ownvalue = 0;
	}

	componentDidMount() {
		this.deriveInfo();
		// console.log("this.props.validator", this.state.validator);
		// console.log("this.props.validatorData", this.props.validatorData);
		// const result =this.props.validatorData.filter(data => data.stashId === this.state.validator);
		// console.log("result", result);
		// if(this.props.validatorTableData){
		// 	const earnings = this.props.validatorTableData.map(data => data);
		// 	console.log("earnings", this.props.validatorTableData);
		// 	this.setState({
		// 		dailyEarning: Math.max(...earnings)
		// 	})
		// 	console.log("yoyo");
		// }
	}

	deriveInfo = async () => {
		const { validator } = this.state;
		const wsProvider = new WsProvider("wss://kusama-rpc.polkadot.io");
		const api = await ApiPromise.create({ provider: wsProvider });
		await api.isReady;

		let validatorInfo = undefined;
		let nominators = [];
		let name = "";
		name = await api.query.nicks.nameOf(validator);
		validatorInfo = this.props.electedInfo.info.find(
		  data => data.stashId.toString() === validator
		);
		nominators = await validatorInfo.stakers.others;
		console.log("nominators", nominators);
		// if (!this.props.validatorandintentionloading) {
		// 	const validatorList = this.props.validatorsandintentions
		// 		.toString()
		// 		.split(",");
		// 	if (validatorList.includes(validator)) {
		// 		validatorInfo = this.props.electedInfo.info.find(
		// 			data => data.stashId.toString() === validator
		// 		);
		// 		name = await api.query.nicks.nameOf(validator);
		// 		nominators = await validatorInfo.stakers.others;
		// 	}
		// }
		if (!this.ismounted) {
			this.setState(state => ({
				...state,
				validatorInfo: validatorInfo,
				nominators: nominators,
				name: name.raw[0]
					? hexToString(name.raw[0].toString())
					: `Validator (...${validator.slice(-6, -1)})`,
				isloading: false,
				isLoaded: true
			}));
		}
		this.ismounted = true;
	};

	handleOnMouseOver = () => {
		this.setState({ showValidatorAddress: true });
	};

	handleOnMouseOut = () => {
		this.setState({ showValidatorAddress: false });
	};

	onCopy = () => {
		if (this.ismounted) {
			this.setState({ copied: true }, () => {
				console.log("copied state set");
				setInterval(() => {
					this.setState({ copied: false });
				}, 3000);
			});
		}
	};

	render() {
		console.log("State", this.state);
		console.log("Props", this.props);
		const width = window.innerWidth - 350;
		const height = window.innerHeight;
		let radius = 120;

		// let value = "";
		let validator = "";
		let valinfo = "";
		let totalinfo = "";
		// if (!this.props.validatorandintentionloading && !this.state.isloading) {
		// 	totalinfo = this.props.valtotalinfo;
		// 	this.totalvalue =
		// 		this.pathArray[4] === "kusama"
		// 			? this.state.validatorInfo.stakers.total / Math.pow(10, 12)
		// 			: this.state.validatorInfo.stakers.total / Math.pow(10, 15);
		// 	this.ownvalue =
		// 		this.pathArray[4] === "kusama"
		// 			? this.state.validatorInfo.stakers.own / Math.pow(10, 12)
		// 			: this.state.validatorInfo.stakers.own / Math.pow(10, 15);
		// 	validator = this.state.validatorInfo.accountId;
		// 	valinfo = value;
		// 	if (
		// 		this.props.intentions.includes(
		// 			this.props.history.location.pathname.split("/")[3].toString()
		// 		)
		// 	) {
		// 		this.totalvalue =
		// 			this.state.validatorInfo.stakingLedger.total / 10 ** 12;
		// 		this.ownvalue = this.state.validatorInfo.stakingLedger.total / 10 ** 12;
		// 	}
		// }

		let totalBonded = 0;
		totalBonded = this.totalvalue.toFixed(3) - this.ownvalue.toFixed(3);

		if (this.state.nominators.length > 10) {
			radius = 200;
		}
		let opacity = 0.3;
		let color = "#E50B7B";
		// if (this.props.intentions.includes(this.state.validator)) {
		// 	opacity = 0;
		// 	color = "yellow";
		// }
		if (this.state.isLoaded) {
			return (
				<React.Fragment>
					<Box textAlign="center">
						<Box display="flex" justifyContent="center" mt={20} mb={8}>
							<Text alignSelf="center">{this.state.name}</Text>
							<IconButton
								ml={4}
								icon="copy"
								onClick={() => {
									navigator.clipboard
										.writeText(validator)
										.then(this.onCopy, () =>
											console.log(`Something went wrong`)
										);
								}}
							/>
						</Box>
						<Text mt={8} color="brand.900" opacity={this.state.copied ? 1 : 0}>
							Copied to your clipboard
						</Text>
					</Box>
					<Grid templateColumns="1fr 2fr" gap={2}>
					<Box width={350} height={600} style={{marginRight: 20,boxShadow: "0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)", borderRadius: '10px', padding: "5px 10px"}}>
					<Flex 
						flexDirection="column"
						alignItems="center">
					<Text align="center" mt={2} fontSize="2xl" fontWeight="semibold" lineHeight="short">
						Key Stats
					</Text>
					</Flex>
					<Divider />
					<Flex
						flexDirection="column"
						style={{padding: '0 20px'}}
					>
					<Text mt={2} fontSize="md" fontWeight="semibold" lineHeight="short">
						Stake amount
					</Text>
					<Text fontSize="md" color="gray.500">
						(change input to see potential earnings)
					</Text>
					<InputGroup>
						<Input
							placeholder="Stake Amount"
							variant="filled"
							value={this.state.stakeInput}
							textAlign="center"
							roundedLeft="2rem"
							onChange={e => {
								const ERA_PER_DAY = 4;
								const stakeAmount = isNaN(parseFloat(e.target.value))
										? 0
										: parseFloat(e.target.value)
								const {totalStake, poolReward} = this.state.currentValidatorData
								const userStakeFraction = stakeAmount / (stakeAmount + totalStake);
								const dailyEarning = userStakeFraction * poolReward * ERA_PER_DAY; //if pool reward is zero then what ?
								this.setState({
									stakeInput: stakeAmount,
									dailyEarning: dailyEarning.toFixed(3)
								})
							}}
						/>
						<InputRightAddon
							children="KSM"
							backgroundColor="teal.500"
							roundedRight="2rem"
						/>
					</InputGroup>
					<Text mt="3" fontSize="md" >
					Daily Earning
					</Text>
					<Text>
						<span
						style={{textTransform: "uppercase", fontWeight: "bold", color: "#E50B7B"}}
						>{this.state.dailyEarning} KSM</span>
						<span style={{float: "right"}}>percentage daily</span>
					</Text>
					</Flex>
					<Divider />
					<Flex flexDirection="column" style={{padding: '0 20px'}}>
						<Text>Commission</Text>
						<Text>{this.state.validatorInfo && this.state.validatorInfo.validatorPrefs.commission}%</Text>
					</Flex>
					<Divider />
					<Flex flexDirection="column" style={{padding: '0 20px'}}>
					<Text>Backers <span style={{color: "#718096", fontSize: 12}}>(number of stakers)</span></Text>
					<Text>
						{this.state.validatorInfo && this.state.validatorInfo.stakers.others.length}
					</Text>
					</Flex>
					<Divider />
					<Flex flexDirection="column" style={{padding: '0 20px'}}>
						<Text>Amount of stake</Text>
						<Text>Total</Text>
						<Text>Total stake</Text>
						<Text>Staked by self</Text>
						<Text>1.000 KSM</Text>
						<Text>staked by others</Text>
						<Text>21,00,00 KSM</Text>
					</Flex>
					</Box>
					<Stage width={width} height={height} draggable={true}>
						<Layer>
							{/* Here n is number of white circles to draw
		                	r is radius of the imaginary circle on which we have to draw white circles
		                	x,y is center of imaginary circle
		             	*/}

							<WhiteCircles
								colorMode={this.props.colorMode}
								n={this.state.nominators.length}
								r={radius}
								x={width / 2 + 13}
								y={height / 2 + 6}
								nominators={this.state.nominators}
								history={this.props.history}
								totalinfo={totalinfo}
								valinfo={valinfo}
							/>

							{/* Arc used to create the semicircle on the right,
		            		Rotation is used to rotate the arc drawn by 90 degrees in clockwise direction
		       			*/}
							<Arc
								x={width - 2}
								y={height / 2}
								innerRadius={height / 2 - 25}
								outerRadius={height / 2 - 24}
								rotation={90}
								angle={180}
								stroke={
									this.props.colorMode === "light" ? "#CBD5E0" : "#718096"
								}
								strokeWidth={4}
							/>
							{/* Adding 6 to stating and ending y point and 24 to length of line
		            		because the upper left corner of rectangle is at width/2,height/2
		            		so mid point of rectangle becomes width/2+12,height/2+6
		         		*/}
							<Line
								points={[
									width / 2,
									height / 2 + 6,
									width - height / 2 + 23,
									height / 2 + 6
								]}
								fill={this.props.colorMode === "light" ? "#1A202C" : "#FFFFFF"}
								stroke={
									this.props.colorMode === "light" ? "#1A202C" : "#FFFFFF"
								}
								opacity={opacity}
							/>

							<Rect
								x={width / 2}
								y={height / 2}
								width={26}
								height={12}
								fill={color}
								cornerRadius={10}
								onMouseOver={this.handleOnMouseOver}
								onMouseOut={this.handleOnMouseOut}
							/>
						</Layer>
					</Stage>
					</Grid>
					{/* <Flex justifyContent="center">
						<Box
							mt={12}
							display="flex"
							justifyContent="space-between"
							width="100%"
							maxW="960px"
							alignSelf="center"
							mb={8}
						>
							<Text>Total Staked: {this.totalvalue.toFixed(3)} KSM</Text>
							<Text>
								Validator Self Stake: {this.ownvalue.toString().slice(0, 7)} KSM
							</Text>
							<Text>
								Nominator Stake: {totalBonded.toString().slice(0, 8)} KSM
							</Text>
						</Box>
					</Flex> */}
				</React.Fragment>
			);
		} else {
			return (
				<Box
					display="flex"
					flexDirection="column"
					position="absolute"
					top="50%"
					left="50%"
					transform="translate(-50%, -50%)"
					alignSelf="center"
					justifyContent="center"
					textAlign="center"
					mt={-16}
					zIndex={-1}
				>
					<Spinner as="span" size="lg" alignSelf="center" />
					<Text
						mt={4}
						fontSize="xl"
						color="gray.500"
						textAlign="center"
						alignSelf="center"
					>
						Stabilizing the isotopes...
					</Text>
				</Box>
			);
		}
	}
}

export default withRouter(ValidatorApp);
