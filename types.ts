import { ObjectId, OptionalId } from "mongodb";

export type ContactModel = OptionalId<{
  name: string;
  phone: string;
  timezone: string;
  equipos: ObjectId[];
}>;

export type EquipoModel = OptionalId<{
  name: string;
}>;

export type Contact = {
  id: string;
  name: string;
  phone: string;
  time: string;
  equipos: Equipo[];
};

export type Equipo = {
  id: string;
  name: string;
};

export type APIPhone = {
  is_valid: string;
  timezones: string[];
};

export type APITime = {
  datetime: string;
};
