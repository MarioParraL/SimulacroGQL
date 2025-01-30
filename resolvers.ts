import { Collection } from "mongodb";
import { APIPhone, APITime, ContactModel, EquipoModel } from "./types.ts";
import { ObjectId } from "mongodb";
import { GraphQLError } from "graphql";
type Context = {
  ContactsCollection: Collection<ContactModel>;
  EquiposCollection: Collection<EquipoModel>;
};

type QueryGetContactArgs = {
  id: string;
};

type MutationAddEquipoArgs = {
  name: string;
};

type MutationAddContactArgs = {
  name: string;
  phone: string;
  equipos: string[];
};

type MutationDeleteContactArgs = {
  id: string;
};

type MutationDeleteEquipoArgs = {
  id: string;
};

type MutationUpdateContactArgs = {
  id: string;
  name?: string;
  phone?: string;
  equipos?: string[];
};

export const resolvers = {
  Query: {
    getContacts: async (
      _: unknown,
      __: unknown,
      ctx: Context,
    ): Promise<ContactModel[]> => {
      return await ctx.ContactsCollection.find().toArray();
    },

    getContact: async (
      _: unknown,
      args: QueryGetContactArgs,
      ctx: Context,
    ): Promise<ContactModel | null> => {
      return await ctx.ContactsCollection.findOne(
        { _id: new ObjectId(args.id) },
      );
    },

    getEquipos: async (
      _: unknown,
      __: unknown,
      ctx: Context,
    ): Promise<EquipoModel[]> => {
      return await ctx.EquiposCollection.find().toArray();
    },

    getEquipo: async (
      _: unknown,
      args: QueryGetContactArgs,
      ctx: Context,
    ): Promise<EquipoModel | null> => {
      return await ctx.EquiposCollection.findOne(
        { _id: new ObjectId(args.id) },
      );
    },
  },

  Mutation: {
    addEquipo: async (
      _: unknown,
      args: MutationAddEquipoArgs,
      ctx: Context,
    ): Promise<EquipoModel> => {
      const { name } = args;
      const { insertedId } = await ctx.EquiposCollection.insertOne({
        name,
      });

      return {
        _id: insertedId,
        name,
      };
    },

    addContact: async (
      _: unknown,
      args: MutationAddContactArgs,
      ctx: Context,
    ): Promise<ContactModel> => {
      const { name, phone, equipos } = args;

      const existContact = await ctx.ContactsCollection.countDocuments({
        phone,
      });
      if (existContact >= 1) throw new GraphQLError("Contact Exists");

      const API_KEY = Deno.env.get("API_KEY");
      if (!API_KEY) throw new Error("API_KEY ERROR");

      const url = `https://api.api-ninjas.com/v1/validatephone?number=${phone}`;
      const data = await fetch(url, {
        headers: {
          "X-API-KEY": API_KEY,
        },
      });

      if (data.status !== 200) throw new Error("API NINJAS ERROR");

      const response: APIPhone = await data.json();

      if (!response.is_valid) throw new Error("Invalid phone format");

      const timezone = response.timezones[0];

      const { insertedId } = await ctx.ContactsCollection.insertOne({
        name,
        phone,
        timezone,
        equipos: equipos.map((e) => new ObjectId(e)),
      });

      return {
        _id: insertedId,
        name,
        phone,
        timezone,
        equipos: equipos.map((e) => new ObjectId(e)),
      };
    },

    updateContact: async (
      _: unknown,
      args: MutationUpdateContactArgs,
      ctx: Context,
    ): Promise<ContactModel> => {
      const { id, name, phone } = args;

      if (!phone && !name) throw new GraphQLError("Need to update a value");

      if (!phone) {
        const newContact = await ctx.ContactsCollection.findOneAndUpdate(
          { _id: new ObjectId(id) },
          { $set: { name } },
        );

        if (!newContact) throw new Error("Contact not found");
        return newContact;
      }

      const existPhone = await ctx.ContactsCollection.findOne({ phone });
      if (existPhone) {
        const newContact = await ctx.ContactsCollection.findOneAndUpdate(
          { _id: new ObjectId(id) },
          { $set: { name: name || existPhone.name } },
        );
        if (!newContact) throw new GraphQLError("Contact not found");
        return newContact;
      }
    },

    deleteContact: async (
      _: unknown,
      args: MutationDeleteContactArgs,
      ctx: Context,
    ): Promise<boolean> => {
      const { deletedCount } = await ctx.ContactsCollection.deleteOne(
        { _id: new ObjectId(args.id) },
      );

      return deletedCount === 1;
    },

    deleteEquipo: async (
      _: unknown,
      args: MutationDeleteEquipoArgs,
      ctx: Context,
    ): Promise<boolean> => {
      const { deletedCount } = await ctx.EquiposCollection.deleteOne(
        { _id: new ObjectId(args.id) },
      );

      await ctx.ContactsCollection.updateMany(
        { equipos: new ObjectId(args.id) },
        { $pull: { equipos: new ObjectId(args.id) } },
      );

      return deletedCount === 1;
    },
  },

  Contact: {
    id: (parent: ContactModel) => {
      return parent._id!.toString();
    },

    time: async (parent: ContactModel): Promise<string> => {
      const API_KEY = Deno.env.get("API_KEY");
      if (!API_KEY) throw new GraphQLError("API_KEY ERROR");

      const timezone = parent.timezone;
      const url =
        `https://api.api-ninjas.com/v1/worldtime?timezone=${timezone}`;
      const data = await fetch(url, {
        headers: {
          "X-API-KEY": API_KEY,
        },
      });
      if (data.status !== 200) throw new GraphQLError("API NINJAS ERROR");

      const response: APITime = await data.json();
      return response.datetime;
    },

    equipos: async (
      parent: ContactModel,
      _: unknown,
      ctx: Context,
    ): Promise<EquipoModel[]> => {
      const ids = parent.equipos;
      return await ctx.EquiposCollection.find({ _id: { $in: ids } }).toArray();
    },
  },

  Equipo: {
    id: (parent: ContactModel) => {
      return parent._id!.toString();
    },
  },
};
