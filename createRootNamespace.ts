import {
  Account,
  Deadline,
  NetworkType,
  RegisterNamespaceTransaction,
  TransactionHttp, UInt64
} from 'nem2-sdk'

// 00 - Config
const NODE_URL = 'http://localhost:3000'
const ROOT_NAME = 'tutellus'
const OWNER_PK = '81C4992CBAC4C7351539ACC2A66F535423342D0ABDCA397EAF96DABF28ABDD96'

const transactionHttp = new TransactionHttp(NODE_URL)

const account = Account.createFromPrivateKey(OWNER_PK, NetworkType.MIJIN_TEST)

const registerNamespaceTransaction = RegisterNamespaceTransaction.createRootNamespace(
  Deadline.create(),
  ROOT_NAME,
  UInt64.fromUint(1000),
  NetworkType.MIJIN_TEST)

const signedTransaction = account.sign(registerNamespaceTransaction)

transactionHttp
  .announce(signedTransaction)
  .subscribe(x => console.log(x), err => console.error(err));
