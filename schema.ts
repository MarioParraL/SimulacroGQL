export const schema = `#graphql

type Contact{
    id: ID!
    name: String!
    phone: String!
    time: String!
    equipos: [Equipo!]!
}

type Equipo{
    id: ID!
    name: String!
}

type Query{
    getContacts: [Contact!]!
    getContact(id:ID!): Contact!
    getEquipos: [Equipo!]!
    getEquipo(id: ID!): Equipo!
}

type Mutation{
    addContact(name: String!, phone: String!, equipos: [ID!]!): Contact!
    updateContact(id: ID!, name: String, phone: String): Contact!
    deleteContact(id: ID!): Boolean!

    addEquipo(name: String!): Equipo!
    deleteEquipo(id: ID!): Boolean!
}

`;
