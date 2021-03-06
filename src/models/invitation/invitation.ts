import { String, Record, Number, Literal, Union } from "runtypes";
import { DynamoDB } from "aws-sdk";
import { put, get, query, putItems } from "../../services/dynamoDb";
import { IdentityGroup, DbEntry, Invitation } from "../../types";
import { config } from "../../config";

const PK_PREFIX = `IDENTITY_GROUP#`;
const SK_PREFIX = `#INVITATION#`;

export const InvitationEntryRT = Record({
  PK: String.withConstraint(s => s.startsWith(PK_PREFIX)),
  SK: String.withConstraint(s => s.startsWith(SK_PREFIX)),
  data: Union(
    Record({
      name: String,
      email: String,
      created: Number,
      state: Literal("CONSUMED"),
      consumedBy: String
    }),
    Record({
      name: String,
      email: String,
      created: Number,
      state: Literal("UNCONSUMED")
    })
  )
});

export const transformEntryToInvitation = (raw: DbEntry): Invitation => {
  const entry = InvitationEntryRT.check(raw);

  return {
    identityGroup: entry.PK.substring(PK_PREFIX.length),
    code: entry.SK.substring(SK_PREFIX.length),
    ...entry.data
  };
};

export const transformInvitationToEntry = (invitation: Invitation) => {
  const { identityGroup, code, ...rest } = invitation;
  return {
    PK: `${PK_PREFIX}${identityGroup}`,
    SK: `${SK_PREFIX}${code}`,
    data: rest
  };
};

export const putMultipleInvitationEntries = async (invitations: Invitation[]) => {
  const param: DynamoDB.DocumentClient.TransactWriteItemsInput = {
    TransactItems: invitations.map(invitation => ({
      Put: {
        TableName: config.dynamodb.table,
        Item: transformInvitationToEntry(invitation)
      }
    }))
  };
  await putItems(param);
  return invitations;
};

export const insertInvitationEntry = async (invitation: Invitation) => {
  const param = {
    TableName: config.dynamodb.table,
    Item: transformInvitationToEntry(invitation)
  };
  await put(param);
  return transformEntryToInvitation(param.Item);
};

export const getInvitation = async ({ identityGroup, code }: Pick<Invitation, "identityGroup" | "code">) => {
  const param = {
    TableName: config.dynamodb.table,
    Key: {
      PK: `${PK_PREFIX}${identityGroup}`,
      SK: `${SK_PREFIX}${code}`
    }
  };
  const { Item } = await get(param);
  return Item ? transformEntryToInvitation(Item as any) : undefined;
};

export const listInvitationByIdentityGroup = async ({
  identityGroup
}: Pick<Invitation, "identityGroup">): Promise<IdentityGroup[]> => {
  const params: AWS.DynamoDB.DocumentClient.QueryInput = {
    TableName: config.dynamodb.table,
    KeyConditionExpression: "PK = :PK AND begins_with(SK, :SK)",
    ExpressionAttributeValues: {
      ":PK": `${PK_PREFIX}${identityGroup}`,
      ":SK": `${SK_PREFIX}`
    }
  };
  const { Items } = await query(params);
  return Items.map(transformEntryToInvitation);
};
