export interface DiscordField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordEmbed {
  title: string;
  description?: string;
  url?: string; // Link al hacer click en el título
  color?: number; // Código de color decimal (ej: 16711680 para rojo)
  fields?: DiscordField[];
  footer?: {
    text: string;
    icon_url?: string;
  };
  timestamp?: string; // Formato ISO
}
