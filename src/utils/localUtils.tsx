interface Translations {
  [key: string]: {
    [key: string]: string;
  };
}

interface LanguageOption {
  code: string;
  flag: string;
}

export const languageOptions: {
  languages: LanguageOption[];
} = {
  languages: [
    {
      code: "en-US",
      flag: "🇺🇸",
    },
    {
      code: "es-ES",
      flag: "🇪🇸",
    },
    {
      code: "fr-FR",
      flag: "🇫🇷",
    },
    // Add more languages if needed
  ],
};

export const translations: Translations = {
  "en-US": {
    greeting: "Select a conversation on the left to get started.",
    online: "Online",
    connecting: "Connecting",
    offline: "Offline",
    createNewConvo: "Create New Conversation",
    newConvo: "New Conversation",
    convoName: "Conversation name",
    convoDescription: "Enter conversation name",
    editConvo: "Edit Conversation",
    convoError: "Add a conversation title to create a conversation.",
    convoSearch: "Search",
    convoEmpty: "No messages",
    convoLoading: "Loading...",
    convoPlaceholder: "Add your message",
    cancel: "Cancel",
    save: "Save",
    back: "Back",
    add: "Add",
    remove: "Remove",
    signout: "Sign Out",
    userProfileTxt: "Member Profile",
    identityTxt: "Identity",
    friendlyNameTxt: "Name (friendly_name)",
    selectLocal: "Select a Local",
    clockFormat: "24 hour clock",
    clockHelper: "format for timestamps",
    muteConvo: "Mute Conversation",
    unmuteConvo: "Unmute Conversation",
    manageParticipants: "Manage Participants",
    participants: "Participants",
    addParticipant: "Add Participant",
    smsParticipant: "SMS Participant",
    whatsAppParticipant: "SMS participant",
    chatParticipant: "Participant",
    leaveConvo: "Leave Conversation",
    addParticipants: "Add Participants",
    addWhatsAppParticipant: "Add WhatsApp participant",
    addSMSParticipant: "Add SMS participant",
    addChatParticipant: "Add Participant",
    otherParticipants: "and {count} other participants",
    singularParticipant: "and 1 other participant",
    whatsAppNum: "WhatsApp number",
    whatsAppHelpTxt: "The WhatsApp phone number of the participant.",
    smsNum: "Phone number",
    smsHelpTxt: "The phone number of the participant.",
    proxyNum: "Proxy phone number",
    proxyNumHelpTxt:
      "The Twilio phone number used by the participant in Conversations.",
    userIdentity: "User identity",
    userIdentityHelperTxt:
      "The identity used by the participant in Conversations.",
  },
  "es-ES": {
    greeting: "Seleccione una conversación a la izquierda para comenzar.",
    online: "En línea",
    connecting: "Conectando",
    offline: "Desconectado",
    createNewConvo: "Crear nueva conversación",
    newConvo: "Nueva conversación",
    convoName: "Nombre de la conversación",
    convoDescription: "Ingrese el nombre de la conversación",
    editConvo: "Editar conversación",
    convoError:
      "Agregue un título de conversación para crear una conversación.",
    convoSearch: "Buscar",
    convoEmpty: "No hay mensajes",
    convoLoading: "Cargando...",
    convoPlaceholder: "Agregar su mensaje",
    cancel: "Cancelar",
    save: "Guardar",
    back: "Atrás",
    add: "Add",
    remove: "Eliminar",
    signout: "Cerrar sesión",
    userProfileTxt: "Perfil de usuario",
    identityTxt: "Identidad",
    friendlyNameTxt: "Nombre (friendly_name)",
    selectLocal: "Seleccionar local",
    clockFormat: "Formato de 24 horas",
    clockHelper: "formato para marcas de tiempo",
    muteConvo: "Silenciar conversación",
    unmuteConvo: "Activar sonido de la conversación",
    manageParticipants: "Gestionar participantes",
    participants: "Participantes",
    addParticipant: "Agregar participante",
    smsParticipant: "Participante de SMS",
    whatsAppParticipant: "Participante de WhatsApp",
    chatParticipant: "Participante de chat",
    leaveConvo: "Abandonar conversación",
    addParticipants: "Agregar participantes",
    addWhatsAppParticipant: "Agregar participante de WhatsApp",
    addSMSParticipant: "Agregar participante de SMS",
    addChatParticipant: "Agregar participante de chat",
    otherParticipants: "y {count} participantes más",
    singularParticipant: "y 1 participante más",
    whatsAppNum: "Número de WhatsApp",
    whatsAppHelpTxt: "El número de teléfono de WhatsApp del participante.",
    smsNum: "Número de teléfono",
    smsHelpTxt: "El número de teléfono del participante.",
    proxyNum: "Número de teléfono proxy",
    proxyNumHelpTxt:
      "El número de teléfono de Twilio utilizado por el participante en Conversaciones.",
    userIdentity: "Identidad de usuario",
    userIdentityHelperTxt:
      "La identidad utilizada por el participante en Conversaciones.",
  },
  "fr-FR": {
    greeting: "Sélectionnez une conversation sur la gauche pour commencer.",
    online: "En ligne",
    connecting: "Connexion",
    offline: "Hors ligne",
    createNewConvo: "Créer une nouvelle conversation",
    newConvo: "Nouvelle conversation",
    convoName: "Nom de la conversation",
    convoDescription: "Entrer le nom de la conversation",
    editConvo: "Modifier la conversation",
    convoError: "Ajoutez un titre de conversation pour créer une conversation.",
    convoSearch: "Chercher",
    convoEmpty: "Aucun message",
    convoLoading: "Chargement...",
    convoPlaceholder: "Ajouter votre message",
    cancel: "Annuler",
    save: "Enregistrer",
    back: "Retour",
    add: "Add",
    remove: "Supprimer",
    signout: "Déconnexion",
    userProfileTxt: "Profil utilisateur",
    identityTxt: "Identité",
    friendlyNameTxt: "Nom (friendly_name)",
    selectLocal: "Sélectionner un local",
    clockFormat: "Format 24 heures",
    clockHelper: "format pour les horodatages",
    muteConvo: "Muter la conversation",
    unmuteConvo: "Activer le son de la conversation",
    manageParticipants: "Gérer les participants",
    participants: "Participants",
    addParticipant: "Ajouter un participant",
    smsParticipant: "Participant SMS",
    whatsAppParticipant: "Participant WhatsApp",
    chatParticipant: "Participant au chat",
    leaveConvo: "Quitter la conversation",
    addParticipants: "Ajouter des participants",
    addWhatsAppParticipant: "Ajouter un participant WhatsApp",
    addSMSParticipant: "Ajouter un participant SMS",
    addChatParticipant: "Ajouter un participant au chat",
    otherParticipants: "et {count} autres participants",
    singularParticipant: "et 1 autre participant",
    whatsAppNum: "Numéro WhatsApp",
    whatsAppHelpTxt: "Le numéro de téléphone WhatsApp du participant.",
    smsNum: "Numéro de téléphone",
    smsHelpTxt: "Le numéro de téléphone du participant.",
    proxyNum: "Numéro de téléphone proxy",
    proxyNumHelpTxt:
      "Le numéro de téléphone Twilio utilisé par le participant dans les Conversations.",
    userIdentity: "Identité de l'utilisateur",
    userIdentityHelperTxt:
      "L'identité utilisée par le participant dans les Conversations.",
  },
  // Add translations for other languages as needed
};

export const getTranslation = (language: string, key: string): string => {
  if (translations[language] && translations[language][key]) {
    return translations[language][key];
  } else {
    return `Translation not available for '${key}' in '${language}'`;
  }
};
