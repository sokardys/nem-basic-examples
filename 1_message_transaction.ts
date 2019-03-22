import {
  Account,
  Address,
  Deadline,
  NetworkType,
  PlainMessage,
  TransactionHttp,
  TransferTransaction
} from 'nem2-sdk'

// 00 - Config
const NODE_URL = 'http://localhost:3000'
const CUSTOMER_ADDRESS = 'SBMY7CC5TBFAIFY3C24FBI4XMKKZWDUWHPVCCIUK'
const VENDOR_PK = 'B71DE8FB5F3905B616668BEA55FEAA6A60BCF4447A49A6A3FCBC97265C690267'
const TRANSFER_MESSAGE = 'Mensaje de DEMO'

// 01 - Set up
const transactionHttp = new TransactionHttp(NODE_URL)

const customerAddress = Address.createFromRawAddress(CUSTOMER_ADDRESS)

const vendorAccount = Account.createFromPrivateKey(VENDOR_PK, NetworkType.MIJIN_TEST)

// 02 - Create the transfer transaction
const transferTransaction = TransferTransaction.create(
    Deadline.create(),
    customerAddress,
    [],
    PlainMessage.create(TRANSFER_MESSAGE),
    NetworkType.MIJIN_TEST)

// 03 - Sign the transaction with vendor account
const signedTransaction = vendorAccount.sign(transferTransaction)

// 04 - Announce the transaction
transactionHttp
    .announce(signedTransaction)
    .subscribe(x => console.log(x), err => console.error(err))
