import {
  Account,
  Address,
  Deadline,
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
const CUSTOMER_ADDRESS = '-- INSERT --'
const VENDOR_PK = '-- INSERT --'
const MOSAIC_HEXID = '-- INSERT --'
const TRANSFER_MESSAGE = 'Your mosaic'

// 01 - Set up
const transactionHttp = new TransactionHttp(NODE_URL)

const customerAddress = Address.createFromRawAddress(CUSTOMER_ADDRESS)

const vendorAccount = Account.createFromPrivateKey(VENDOR_PK, NetworkType.MIJIN_TEST)

// 02 - Create the transfer transaction
const transferTransaction = TransferTransaction.create(
  Deadline.create(),
  customerAddress,
  [new Mosaic(new MosaicId(MOSAIC_HEXID), UInt64.fromUint(1))],
  PlainMessage.create(TRANSFER_MESSAGE),
  NetworkType.MIJIN_TEST)

// 03 - Sign the transaction with vendor account
const signedTransaction = vendorAccount.sign(transferTransaction)

// 04 - Announce the transaction
transactionHttp
  .announce(signedTransaction)
  .subscribe(x => console.log(x), err => console.error(err))
