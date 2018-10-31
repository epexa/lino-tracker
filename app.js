swal.setDefaults({
	buttonsStyling: true,
	confirmButtonText: '<span class="icon-checkmark"></span> Ok',
	confirmButtonColor: '#5cb85c',
	cancelButtonText: '<span class="icon-cross"></span> Cancel',
	cancelButtonColor: '#d9534f',
});

initHtmlElements([ '#main-page', '#head-block-number', '#recent-blocks-table tbody', '#reset-node-address', '#change-work-real-time', '#auto-clear-real-time-after', '#back-to-top', '#node-address', '#node-address-modal-btn', '#clear-real-time', '#validators-page', '#validators-table tbody', '#apps-page', '#apps-table tbody', '#infra-providers-page', '#infra-providers-table tbody', '#about-block-page', '#about-block-code', '#about-block-table tbody', '#about-block-operations-table tbody', '#about-block-transactions-table tbody', '#reset-search-btn', '#search', '#about-block-height', '#about-block-time', '#about-block-validators-count', '#about-block-transactions-count', '#about-block-operations', '#about-account-page' ]);

let $nodeAddressInput = $nodeAddress.querySelector('.form-control[name="node-address"]');
let defaultNodeAddress = $nodeAddressInput.value;

if (localStorage && localStorage.nodeAddress) $nodeAddressInput.value = localStorage.nodeAddress;

let nodeAddress = $nodeAddressInput.value;
let $modalNodeAddress = new Modal(document.getElementById('modal-node-address'));
let workRealTime = true;

const lino = new window.lino.LINO({
	nodeUrl: nodeAddress,
	chainId: 'lino-testnet'
});

if (nodeAddress != defaultNodeAddress) $resetNodeAddress.style.display = 'block';

$nodeAddressModalBtn.addEventListener('click', () => {
	$modalNodeAddress.show();
});

$nodeAddress.addEventListener('submit', (e) => {
	e.preventDefault();
	localStorage.nodeAddress = $nodeAddressInput.value;
	window.location.reload();
});

$resetNodeAddress.addEventListener('click', () => {
	$nodeAddressInput.value = defaultNodeAddress;
	$nodeAddressInput.dispatchEvent(new CustomEvent('submit'));
	$resetNodeAddress.style.display = 'none';
});

let $searchVal = $search.querySelector('.form-control[name="search"]');

//new Tooltip($searchVal);

let camelCaseParam = (str) => {
	str = str.replace(/^\w/, c => c.toUpperCase());
	return str.replace(/_([a-z])/g, (_m, l) => {
		return ' ' + l.toUpperCase();
	});
}

let blockchainParametersTableHandler = ($tableId, properties) => {	
	const $blockchainParametersTableTbody = document.getElementById($tableId).querySelector('tbody');
	for (let key in properties) {
		const $newRow = $blockchainParametersTableTbody.insertRow(0);
		const paramName = camelCaseParam(key);
		let paramValue = properties[key];
		//if (typeof(paramValue) == 'object') paramValue = JSON.stringify(paramValue);
		if (typeof(paramValue) == 'object' && Object.keys(paramValue).length == 1 && paramValue.amount) paramValue = paramValue.amount;
		$newRow.innerHTML = `<tr><td>${paramName}</td><td><b>${paramValue}</b></td></tr>`;
	}
}

lino.query
	.getGlobalMeta()
	.then(properties => {
		blockchainParametersTableHandler('global-meta-table', properties);
	});

lino.query
	.getConsumptionMeta()
	.then(properties => {
		blockchainParametersTableHandler('get-consumption-meta-table', properties);
	});

lino.query
	.getEvaluateOfContentValueParam()
	.then(properties => {
		blockchainParametersTableHandler('evaluate-of-content-value-param-table', properties);
	});

lino.query
	.getGlobalAllocationParam()
	.then(properties => {
		blockchainParametersTableHandler('global-allocation-param-table', properties);
	});

lino.query
	.getInfraInternalAllocationParam()
	.then(properties => {
		blockchainParametersTableHandler('infra-internal-allocation-param-table', properties);
	});

lino.query
	.getDeveloperParam()
	.then(properties => {
		blockchainParametersTableHandler('developer-param-table', properties);
	});

lino.query
	.getVoteParam()
	.then(properties => {
		blockchainParametersTableHandler('vote-param-table', properties);
	});

lino.query
	.getProposalParam()
	.then(properties => {
		blockchainParametersTableHandler('proposal-param-table', properties);
	});

lino.query
	.getValidatorParam()
	.then(properties => {
		blockchainParametersTableHandler('validator-param-table', properties);
	});

lino.query
	.getCoinDayParam()
	.then(properties => {
		blockchainParametersTableHandler('coin-day-param-table', properties);
	});

lino.query
	.getBandwidthParam()
	.then(properties => {
		blockchainParametersTableHandler('bandwidth-param-table', properties);
	});

lino.query
	.getAccountParam()
	.then(properties => {
		blockchainParametersTableHandler('account-param-table', properties);
	});

lino.query
	.getPostParam()
	.then(properties => {
		blockchainParametersTableHandler('post-param-table', properties);
	});

$changeWorkRealTime.addEventListener('click', () => {
	if (workRealTime) {
		workRealTime = false;
		$changeWorkRealTime.innerHTML = '<span class="icon-play3"></span> Start monitoring';
		$changeWorkRealTime.className = 'btn btn-success btn-sm float-right';
	}
	else {
		workRealTime = true;
		$changeWorkRealTime.innerHTML = '<span class="icon-pause2"></span> Pause monitoring';
		$changeWorkRealTime.className = 'btn btn-secondary btn-sm float-right';
	}
});

$clearRealTime.addEventListener('click', () => {
	$recentBlocksTableTbody.innerHTML = '';
	swal({title: 'Table real-time blocks cleared!', type: 'success', showConfirmButton: false, position: 'top-right', toast: true, timer: 3000});
});

let nameTransactionsHandler = (transactions) => {
	let nameTransactions = [];
	transactions.forEach((transaction) => {
		transaction = atob(transaction);
		transaction = JSON.parse(transaction);
		transaction.value.msg[0].type = transaction.value.msg[0].type.replace('lino/', '');
		nameTransactions.push(transaction.value.msg[0].type);
	});
	return nameTransactions;
}

// there is no method in lino-js
const linoGetStatus = (callback) => {
	fetch(nodeAddress + 'status')
		.then((response) => { return response.json(); })
		.then((json) => {
			callback(json);
		});
}

let latestBlockHeight;
setInterval(() => {
	linoGetStatus(status => {
		if (latestBlockHeight != status.result.sync_info.latest_block_height) {
			latestBlockHeight = status.result.sync_info.latest_block_height;
			$headBlockNumber.innerText = status.result.sync_info.latest_block_height;
			if (workRealTime) {
				lino.query
					.getBlock(latestBlockHeight)
					.then(block => {
						const $newRow = $recentBlocksTableTbody.insertRow(0);
						$newRow.className = 'table-new';
						$newRow.innerHTML = `<tr>
												<td><a href="#block/${block.block.header.height}">${block.block.header.height}</a></td>
												<td>${block.block.header.time.substr(11, 8)}</td>
												<td>${block.block.last_commit.precommits.length}</td>
												<td>${block.block.header.num_txs}</td>
											</tr>`;
						setTimeout(() => {
							$newRow.className = 'table-success';
						}, 500);
						setTimeout(() => {
							$newRow.className = 'table-secondary';
						}, 3000);
						if (block.block.data.txs) {
							const nameTransactions = nameTransactionsHandler(block.block.data.txs);
							let nameTransactionsStr = '';
							for (let key in nameTransactions) {
								nameTransactionsStr += `<a class="btn btn-outline-info btn-sm" href="#transactions/${block.block.header.height}/${nameTransactions[key]}">${nameTransactions[key]}</a> `;
							}
							const $newSubRow = $recentBlocksTableTbody.insertRow(1);
							$newSubRow.className = 'table-new';
							$newSubRow.innerHTML = `<tr><td colspan="4">${nameTransactionsStr}</td></tr>`;
							setTimeout(() => {
								$newSubRow.className = 'table-success';
							}, 500);
							setTimeout(() => {
								$newSubRow.className = '';
							}, 3000);
						}
						autoClearRealTime();
					});
			}
		}
	});
}, 2000); // because lino creates new blocks every 4 sec :)

if (localStorage && localStorage.clearAfterBlocksVal) $autoClearRealTimeAfter.value = localStorage.clearAfterBlocksVal;

let autoClearRealTime = () => {
	let clearAfterBlocksVal = parseInt($autoClearRealTimeAfter.value),
		$trs = $recentBlocksTableTbody.getElementsByTagName('tr'),
		trsCount = $trs.length;
	localStorage.clearAfterBlocksVal = clearAfterBlocksVal;
	if (trsCount >= clearAfterBlocksVal * 2) {
		let removeCount = trsCount / 2 - clearAfterBlocksVal;
		for (let i = 0; i < removeCount; i++) {
			$recentBlocksTableTbody.removeChild($trs[trsCount - 1]);
			$recentBlocksTableTbody.removeChild($trs[trsCount - 2]);
			trsCount -= 2;
		}
	}
}

$autoClearRealTimeAfter.addEventListener('change', autoClearRealTime);

window.onscroll = () => {
	let value = document.documentElement.scrollTop || document.body.parentNode.scrollTop;
	if (value > 777) $backToTop.classList.add('showing');
	else $backToTop.classList.remove('showing');
}
$backToTop.addEventListener('click', (e) => {
	e.preventDefault();
	window.scrollTo({
		top: 0,
		behavior: 'smooth'
	});
});

$search.addEventListener('submit', (e) => {
	e.preventDefault();
	$resetSearchBtn.style.display = 'block';
	$mainPage.style.display = 'none';
	$aboutBlockPage.style.display = 'none';
	/* $recentBlocksInfo.style.display = 'none'; */
	let searchVal = $searchVal.value;
	if (/^-?[0-9]+$/.test(searchVal)) {
		//window.location.hash = 'block/' + searchVal;
		$aboutBlockPage.style.display = 'block';
		getBlockFullInfo(searchVal);
	}
	else {
		//window.location.hash = 'account/' + searchVal;
		$aboutAccountPage.style.display = 'block';
		getAccountInfo();
	}
	return false;
});

$resetSearchBtn.addEventListener('click', () => {
	$searchVal.value = '';
	$resetSearchBtn.style.display = 'none';
	$mainPage.style.display = 'flex';
	$aboutBlockPage.style.display = 'none';
	$aboutAccountPage.style.display = 'none';
	window.location.hash = '';
});

let getBlockFullInfo = (blockNumberVal) => {
	$aboutBlockTableTbody.innerHTML = '';
	$aboutBlockTransactionsTableTbody.innerHTML = '';
	$aboutBlockCode.innerHTML = '';
	lino.query
		.getBlock(blockNumberVal)
		.then(block => {
			$aboutBlockHeight.innerText = blockNumberVal;
			$aboutBlockTime.innerText = block.block.header.time.substr(0, 19).replace('T', ' ');
			$aboutBlockValidatorsCount.innerText = block.block.last_commit.precommits.length;
			$aboutBlockTransactionsCount.innerText = block.block.header.num_txs;
			
			if (block.block.data.txs) {
				const nameTransactions = nameTransactionsHandler(block.block.data.txs);
				let operationsStr = '';
				for (let key in nameTransactions) {
					operationsStr += `<a class="btn btn-outline-secondary btn-sm">${nameTransactions[key]}</a> `;
				}
				$newRow = $aboutBlockTableTbody.insertRow();
				$newRow.innerHTML = `<tr>
										<td colspan="5"><span class="badge badge-secondary"></span> ${operationsStr}</td>
									</tr>`;
				
				block.block.data.txs.forEach((transaction) => {
					transaction = atob(transaction);
					transaction = JSON.parse(transaction);
					$newRow = $aboutBlockTransactionsTableTbody.insertRow();
					$newRow.innerHTML = `<tr>
											<td><b>type</b></td>
											<td>${transaction.type}</td>
										</tr>`;
					for (let keyTr in transaction.value) {
						$newRow = $aboutBlockTransactionsTableTbody.insertRow();
						$newRow.innerHTML = `<tr>
												<td><b>${keyTr}</b></td>
												<td>${JSON.stringify(transaction.value[keyTr])}</td>
											</tr>`;
					}
					$newRow = $aboutBlockTransactionsTableTbody.insertRow();
					$newRow.className = 'table-active';
					$newRow.innerHTML = `<tr><td colspan="2">&nbsp;</td></tr>`;
				});
			}
			
			let blockStr = JSON.stringify(block.block);
			blockStr = js_beautify(blockStr);
			$aboutBlockCode.innerHTML = blockStr;
			hljs.highlightBlock($aboutBlockCode);
		});
}

let unixtimeToHumanFormat = (unixtime) => {
	let newDate = new Date();
	newDate.setTime(unixtime * 1000);
	return newDate.toUTCString();
}

let getAccountInfo = () => {
	let usernameVal = $searchVal.value;
	lino.query
		.getAccountInfo(usernameVal)
		.then(accountInfo => {
			for (let key in accountInfo) {
				if (key == 'created_at') accountInfo[key] = unixtimeToHumanFormat(accountInfo[key]);
				const $aboutAccountPageParam = $aboutAccountPage.querySelector(`[data="${key}"]`);
				if ($aboutAccountPageParam) $aboutAccountPageParam.innerText = accountInfo[key];
			}
		});
	lino.query
		.getAccountBank(usernameVal)
		.then(accountBank => {
			for (let key in accountBank) {
				if (key == 'saving') accountBank[key] = accountBank[key].amount;
				if (key == 'coin_day') accountBank[key] = accountBank[key].amount;
				if (key == 'frozen_money_list' && accountBank[key]) accountBank[key] = JSON.stringify(accountBank[key]);
				const $aboutAccountPageParam = $aboutAccountPage.querySelector(`[data="${key}"]`);
				if ($aboutAccountPageParam) $aboutAccountPageParam.innerText = accountBank[key];
			}
		});
	lino.query
		.getAccountMeta('dlivetv-17')
		.then(accountMeta => {
			for (let key in accountMeta) {
				if (key == 'last_activity_at' || key == 'last_report_or_upvote_at') accountMeta[key] = unixtimeToHumanFormat(accountMeta[key]);
				if (key == 'transaction_capacity') accountMeta[key] = accountMeta[key].amount;
				const $aboutAccountPageParam = $aboutAccountPage.querySelector(`[data="${key}"]`);
				if ($aboutAccountPageParam) $aboutAccountPageParam.innerText = accountMeta[key];
			}
		});				
}

window.addEventListener('hashchange', () => {
	let hash = window.location.hash.substring(1);
	if (hash) {
		let params = hash.split('/');
		if (params[1]) {
			switch (params[0]) {
				case 'block': {
					$searchVal.value = params[1];
					$search.dispatchEvent(new CustomEvent('submit'));
				}; break;
			}
		}
		else {
			$searchVal.value = '';
			$resetSearchBtn.style.display = 'none';
			switch (params[0]) {
				case 'validators': {
					$mainPage.style.display = 'none';
					$appsPage.style.display = 'none';
					$infraProvidersPage.style.display = 'none';
					$validatorsPage.style.display = 'block';
					$validatorsTableTbody.innerHTML = '';
					lino.query
						.getAllValidators()
						.then(validators => {
							validators.all_validators.forEach(validator => {
								const $newRow = $validatorsTableTbody.insertRow();
								$newRow.innerHTML = `<tr>
												<td><h5>${validator}</h5></td>
											</tr>`;
							});
						});
				}; break;
				case 'apps': {
					$mainPage.style.display = 'none';
					$validatorsPage.style.display = 'none';
					$infraProvidersPage.style.display = 'none';
					$appsPage.style.display = 'block';
					$appsTableTbody.innerHTML = '';
					lino.query
						.getDevelopers()
						.then(apps => {
							apps.forEach(app => {
								const $newRow = $appsTableTbody.insertRow();
								$newRow.innerHTML = `<tr>
												<td><h5>${app.value.username}</h5></td>
												<td><h5><a target="_blank" href="${app.value.web_site}">${app.value.web_site}</a></h5></td>
												<td><h5>${app.value.deposit.amount}</h5></td>
												<td><h5>${app.value.app_consumption.amount}</h5></td>
												<td><h5>${app.value.description}</h5></td>
											</tr>`;
							});
						});
				}; break;
				case 'infra-providers': {
					$mainPage.style.display = 'none';
					$validatorsPage.style.display = 'none';
					$appsPage.style.display = 'none';
					$infraProvidersPage.style.display = 'block';
					$infraProvidersTableTbody.innerHTML = '';
					lino.query
						.getInfraProviders()
						.then(infraProviders => {
							infraProviders.all_infra_providers.forEach((infraProvider) => {
								const $newRow = $infraProvidersTableTbody.insertRow();
								$newRow.innerHTML = `<tr>
												<td><h5>${infraProvider}</h5></td>
											</tr>`;
							});
						});
				}; break;
			}
		}
	}
	else {
		$searchVal.value = '';
		$resetSearchBtn.style.display = 'none';
		$mainPage.style.display = 'flex';
		$validatorsPage.style.display = 'none';
		$appsPage.style.display = 'none';
		$infraProvidersPage.style.display = 'none';
		$aboutBlockPage.style.display = 'none';
		$aboutAccountPage.style.display = 'none';
		//$recentBlocksInfo.style.display = 'block';
	}
});
window.dispatchEvent(new CustomEvent('hashchange'));