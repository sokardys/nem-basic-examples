import {
  Account,
  AggregateTransaction,
  Deadline,
  Listener,
  LockFundsTransaction,
  Mosaic,
  MosaicId,
  NetworkType,
  PlainMessage,
  PublicAccount,
  TransactionHttp,
  TransferTransaction,
  UInt64,
  XEM
} from 'nem2-sdk'

import { filter, mergeMap } from 'rxjs/operators'

// 00 - Config
const NODE_URL = 'http://localhost:3000'

const CUSTOMER_ADDRESSES_PUBLIC_KEY = 'EFBF94F4B38CC1CA2EC0806EDB1A8EE83ADB87D9C1A92861DF89BC674CB01B91'
const VENDOR_PUBLIC_KEY = 'F170B393B219F0E635232E540B55F86982F542A9587ABF27BD992F71D456E681'
const TUTELLUS_PK = 'F170B393B219F0E635232E540B55F86982F542A9587ABF27BD992F71D456E681'

const MOSAIC_COURSE_HEXID = 'd754251fc06abbbf'
const COURSE_PRICE = 190

// 01 - Set up
const transactionHttp = new TransactionHttp(NODE_URL)
const listener = new Listener(NODE_URL)

const customerPublicAccount = PublicAccount.createFromPublicKey(CUSTOMER_ADDRESSES_PUBLIC_KEY, NetworkType.MIJIN_TEST)

const vendorPublicAccount = PublicAccount.createFromPublicKey(VENDOR_PUBLIC_KEY, NetworkType.MIJIN_TEST)

const tutellusAccount = Account.createFromPrivateKey(TUTELLUS_PK, NetworkType.MIJIN_TEST)

// 02 - Define the transactions

// A
const customerToTutellusTx = TransferTransaction.create(
  Deadline.create(),
  tutellusAccount.address,
  [XEM.createRelative(COURSE_PRICE * 0.30)],
  PlainMessage.create('La comision'),
  NetworkType.MIJIN_TEST)

// B
const customerToTicketVendorTx = TransferTransaction.create(
  Deadline.create(),
  vendorPublicAccount.address,
  [XEM.createRelative(COURSE_PRICE * 0.70)],
  PlainMessage.create('Paying course'),
  NetworkType.MIJIN_TEST)

// C
const vendorToCustomerTx = TransferTransaction.create(
  Deadline.create(),
  customerPublicAccount.address,
  [new Mosaic(new MosaicId(MOSAIC_COURSE_HEXID), UInt64.fromUint(1))],
  PlainMessage.create('Tu curso'),
  NetworkType.MIJIN_TEST)

// D
const tutellusToVendorTx = TransferTransaction.create(
  Deadline.create(),
  vendorPublicAccount.address,
  [],
  PlainMessage.create('Tutellus request'),
  NetworkType.MIJIN_TEST)

// 03 - Create the aggregate complete transaction
const aggregateTransaction = AggregateTransaction.createBonded(
  Deadline.create(),
  [
    customerToTutellusTx.toAggregate(customerPublicAccount),
    customerToTicketVendorTx.toAggregate(customerPublicAccount),
    vendorToCustomerTx.toAggregate(vendorPublicAccount),
    tutellusToVendorTx.toAggregate(tutellusAccount.publicAccount)
  ],
  NetworkType.MIJIN_TEST)

// 04 - Sign the transaction with vendor account
const signedTransaction = tutellusAccount.sign(aggregateTransaction)

// 05 - Create a LockFundsTransaction for the signed transaction, and sign it with the vendor account.
const lockFundsTransaction = LockFundsTransaction.create(
  Deadline.create(),
  XEM.createRelative(10),
  UInt64.fromUint(480),
  signedTransaction,
  NetworkType.MIJIN_TEST)

const lockFundsTransactionSigned = tutellusAccount.sign(lockFundsTransaction)

// 06 - Announce the lock funds transaction.
// Once confirmed, announce the aggregate bonded transaction with the vendor account.
listener.open()
.then(() => {
  transactionHttp
    .announce(lockFundsTransactionSigned)
    .subscribe(x => console.log(x), err => console.error(err))

  listener
    .confirmed(tutellusAccount.address)
    .pipe(
        filter((transaction) => transaction.transactionInfo !== undefined
        && transaction.transactionInfo.hash === lockFundsTransactionSigned.hash),
        mergeMap(ignored => transactionHttp.announceAggregateBonded(signedTransaction))
    )
    .subscribe(announcedAggregateBonded =>
        console.log(announcedAggregateBonded), err => console.error(err))
})
.catch((error) => console.error('** Error', error))
