import {
  Account,
  Address,
  AggregateTransaction,
  Deadline, InnerTransaction,
  Mosaic,
  MosaicId,
  NetworkType,
  PlainMessage,
  TransactionHttp,
  TransferTransaction,
  UInt64
} from 'nem2-sdk'

// 00 - Config
const NODE_URL = 'http://localhost:3000'
const CUSTOMER_ADDRESSES = ['-- INSERT --', '-- INSERT --']
const VENDOR_PK = '-- INSERT --'
const MOSAIC_HEXID = '-- INSERT --'
const TRANSFER_MESSAGE = 'Your mosaic'

// 01 - Set up
const transactionHttp = new TransactionHttp(NODE_URL)

const customersAddresses: Address[] = CUSTOMER_ADDRESSES.map(address =>
  Address.createFromRawAddress(address))

const ticketVendorAccount = Account.createFromPrivateKey(VENDOR_PK, NetworkType.MIJIN_TEST)

// 02 - Create the transfer transactions to send
let transactions: TransferTransaction[] = customersAddresses
  .map(customer => TransferTransaction.create(
      Deadline.create(),
      customer,
      [new Mosaic(new MosaicId(MOSAIC_HEXID), UInt64.fromUint(1))],
      PlainMessage.create(TRANSFER_MESSAGE),
      NetworkType.MIJIN_TEST))

// 03 - Create the aggregate complete transaction
const innerTransactions: InnerTransaction[] = transactions
  .map(transaction => transaction.toAggregate(ticketVendorAccount.publicAccount))

const aggregateTransaction = AggregateTransaction.createComplete(
  Deadline.create(),
  innerTransactions,
  NetworkType.MIJIN_TEST,
  [])

// 04 - Sign the transaction with vendor account
const signedTransaction = ticketVendorAccount.sign(aggregateTransaction)

// 05 - Announce the transaction
transactionHttp
  .announce(signedTransaction)
  .subscribe(x => console.log(x), err => console.error(err))
