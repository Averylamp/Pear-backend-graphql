import { LocationSchema } from './LocationModels';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const matchingDemographicsType = `
type MatchingDemographics {
  gender: Gender
  age: Int
  location: Location
  ethnicity: EthnicityInfo
  educationLevel: EducationLevelInfo
  religion: ReligionInfo
  politicalView: PoliticsInfo
  drinking: DrinkingInfo
  smoking: SmokingInfo
  cannabis: CannabisInfo
  drugs: DrugsInfo
}

enum EthnicityEnum {
  AMERICAN_INDIAN
  BLACK_AFRICAN_DESCENT
  EAST_ASIAN
  HISPANIC_LATINO
  MIDDLE_EASTERN
  PACIFIC_ISLANDER
  SOUTH_ASIAN
  WHITE_CAUCASIAN
  OTHER
  PREFER_NOT_TO_SAY
}

enum EducationLevelEnum {
  HIGH_SCHOOL
  UNDERGRAD
  POSTGRAD
  PREFER_NOT_TO_SAY
}

enum ReligionEnum {
  BUDDHIST
  CATHOLIC
  CHRISTIAN
  HINDU
  JEWISH
  MUSLIM
  SPIRITUAL
  AGNOSTIC
  ATHEIST
  OTHER
  PREFER_NOT_TO_SAY
}

enum PoliticsEnum {
  LIBERAL
  MODERATE
  CONSERVATIVE
  OTHER
  PREFER_NOT_TO_SAY
}

enum HabitsEnum {
  YES
  SOMETIMES
  NO
  PREFER_NOT_TO_SAY
}

type EthnicityInfo {
  response: [EthnicityEnum!]!
  visible: Boolean!
  userHasResponded: Boolean!
}

type EducationLevelInfo {
  response: [EducationLevelEnum!]!
  visible: Boolean!
  userHasResponded: Boolean!
}

type ReligionInfo {
  response: [ReligionEnum!]!
  visible: Boolean!
  userHasResponded: Boolean!
}

type PoliticsInfo {
  response: [PoliticsEnum!]!
  visible: Boolean!
  userHasResponded: Boolean!
}

type DrinkingInfo {
  response: [HabitsEnum!]!
  visible: Boolean!
  userHasResponded: Boolean!
}

type SmokingInfo {
  response: [HabitsEnum!]!
  visible: Boolean!
  userHasResponded: Boolean!
}

type CannabisInfo {
  response: [HabitsEnum!]!
  visible: Boolean!
  userHasResponded: Boolean!
}

type DrugsInfo {
  response: [HabitsEnum!]!
  visible: Boolean!
  userHasResponded: Boolean!
}
`;

const matchingPreferencesType = `
type MatchingPreferences{
  seekingGender: [Gender!]!
  maxDistance: Int!
  minAgeRange: Int!
  maxAgeRange: Int!
  location: Location
}
`;

export const typeDef = matchingDemographicsType + matchingPreferencesType;

const demographicSchemaObject = (multipleResponse, responseEnum) => ({
  response: {
    type: multipleResponse ? [String] : String,
    enum: responseEnum,
    index: true,
    required: true,
    default: multipleResponse ? [] : 'PREFER_NOT_TO_SAY',
  },
  visible: { type: Boolean, required: true, default: false },
  userHasResponded: { type: Boolean, required: true, default: false },
});

const ethnicityEnum = [
  'AMERICAN_INDIAN',
  'BLACK_AFRICAN_DESCENT',
  'EAST_ASIAN',
  'HISPANIC_LATINO',
  'MIDDLE_EASTERN',
  'PACIFIC_ISLANDER',
  'SOUTH_ASIAN',
  'WHITE_CAUCASIAN',
  'OTHER',
  'PREFER_NOT_TO_SAY',
];
const educationLevelEnum = [
  'HIGH_SCHOOL',
  'UNDERGRAD',
  'POSTGRAD',
  'PREFER_NOT_TO_SAY',
];
const religionEnum = [
  'BUDDHIST',
  'CATHOLIC',
  'CHRISTIAN',
  'HINDU',
  'JEWISH',
  'MUSLIM',
  'SPIRITUAL',
  'AGNOSTIC',
  'ATHEIST',
  'OTHER',
  'PREFER_NOT_TO_SAY',
];
const politicalViewEnum = [
  'LIBERAL',
  'MODERATE',
  'CONSERVATIVE',
  'OTHER',
  'PREFER_NOT_TO_SAY',
];
const habitsEnum = [
  'YES',
  'SOMETIMES',
  'NO',
  'PREFER_NOT_TO_SAY',
];

const EthnicityInfoSchema = new Schema(demographicSchemaObject(true, ethnicityEnum));
const EducationLevelSchema = new Schema(demographicSchemaObject(false, educationLevelEnum));
const ReligionInfoSchema = new Schema(demographicSchemaObject(true, religionEnum));
const PoliticsInfoSchema = new Schema(demographicSchemaObject(false, politicalViewEnum));
const DrinkingInfoSchema = new Schema(demographicSchemaObject(false, habitsEnum));
const SmokingInfoSchema = new Schema(demographicSchemaObject(false, habitsEnum));
const CannabisInfoSchema = new Schema(demographicSchemaObject(false, habitsEnum));
const DrugsInfoSchema = new Schema(demographicSchemaObject(false, habitsEnum));

export const MatchingDemographicsSchema = new Schema({
  gender: {
    type: String,
    required: false,
    enum: ['male', 'female', 'nonbinary'],
  },
  age: {
    type: Number,
    required: false,
    min: 18,
    max: 100,
    default: 20,
  },
  location: {
    type: LocationSchema,
    required: false,
  },
  ethnicity: {
    type: EthnicityInfoSchema,
    required: true,
    default: EthnicityInfoSchema,
  },
  educationLevel: {
    type: EducationLevelSchema,
    required: true,
    default: EducationLevelSchema,
  },
  religion: {
    type: ReligionInfoSchema,
    required: true,
    default: ReligionInfoSchema,
  },
  politicalView: {
    type: PoliticsInfoSchema,
    required: true,
    default: PoliticsInfoSchema,
  },
  drinking: {
    type: DrinkingInfoSchema,
    required: true,
    default: DrinkingInfoSchema,
  },
  smoking: {
    type: SmokingInfoSchema,
    required: true,
    default: SmokingInfoSchema,
  },
  cannabis: {
    type: CannabisInfoSchema,
    required: true,
    default: CannabisInfoSchema,
  },
  drugs: {
    type: DrugsInfoSchema,
    required: true,
    default: DrugsInfoSchema,
  },
}, { timestamps: true });


export const MatchingPreferencesSchema = new Schema({
  seekingGender: {
    type: [String],
    required: true,
    enum: ['male', 'female', 'nonbinary'],
    default: ['male', 'female', 'nonbinary'],
  },
  maxDistance: {
    // in miles
    type: Number,
    required: true,
    min: 5,
    max: 200,
    default: 25,
  },
  minAgeRange: {
    type: Number,
    required: true,
    min: 18,
    max: 100,
    default: 18,
  },
  maxAgeRange: {
    type: Number,
    required: true,
    min: 18,
    max: 100,
    default: 27,
  },
  location: {
    type: LocationSchema,
    required: false,
  },
}, { timestamps: true });
