import { useEffect, useState } from "react";
import { GalleryShell, useGallery, type GallerySection } from "@solaria.network/web-lib/gallery";
import { IconLayoutGrid } from "@tabler/icons-react";

// Ponto de partida do preview: troque as seções e os itens pelos do repositório e desenhe o conteúdo de cada um.
// O cabeçalho, o menu com busca, o rodapé, o tema claro e escuro e o idioma (pt-BR, en-US e es-ES) vêm da casca.
const sections: GallerySection[] = [
  {
    id: "examples",
    title: { "pt-BR": "Exemplos", "en-US": "Examples", "es-ES": "Ejemplos" },
    items: [
      {
        id: "first",
        label: { "pt-BR": "Primeiro exemplo", "en-US": "First example", "es-ES": "Primer ejemplo" },
        icon: <IconLayoutGrid size={20} className="shrink-0" aria-hidden="true" />,
      },
    ],
  },
];

function Content({ id }: Readonly<{ id: string }>) {
  const { text } = useGallery();
  return <p>{text({ "pt-BR": `Conteúdo de ${id}.`, "en-US": `Content of ${id}.`, "es-ES": `Contenido de ${id}.` })}</p>;
}

export default function Gallery() {
  const [hash, setHash] = useState(location.hash);
  const wanted = new URLSearchParams(hash.slice(1)).get("item");
  const selected = sections.flatMap((section) => section.items).find((item) => item.id === wanted)?.id ?? sections[0].items[0].id;

  useEffect(() => {
    const changed = () => setHash(location.hash);
    window.addEventListener("hashchange", changed);
    return () => window.removeEventListener("hashchange", changed);
  }, []);

  return (
    <GalleryShell
      title={{ "pt-BR": "Preview", "en-US": "Preview", "es-ES": "Vista previa" }}
      repository="generic-template"
      version={import.meta.env.VITE_VERSION}
      commit={import.meta.env.VITE_COMMIT}
      sections={sections}
      selectedId={selected}
      onSelect={(id) => {
        location.hash = new URLSearchParams({ item: id }).toString();
      }}
    >
      <Content id={selected} />
    </GalleryShell>
  );
}
