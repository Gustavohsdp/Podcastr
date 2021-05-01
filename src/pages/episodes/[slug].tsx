import { GetStaticProps, GetStaticPaths } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link'
import { format, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { convertDurationToTimeString } from '../../utils/convertDurationToTimeString';
import { api } from '../../services/api';

import styles from '../episodes/episode.module.scss';
import { usePlayer } from '../contexts/PlayerContext';


interface Episodes {
  id: string;
  title: string;
  members: string;
  publishedAt: string;
  thumbnail: string;
  durationAsString: string;
  duration: number;
  url: string;
  description: string;
}

interface EpisodeProps {
  episodes: Episodes;
}

export default function Episode({ episodes }: EpisodeProps) {
  const { play } = usePlayer();
  
  return (
    <div className={styles.episode}>
      <Head>
        <title>{episodes.title} | Podcastr</title>
      </Head>
      <div className={styles.thumbnailContainer}>
        <Link href='/'>
          <button type='button'>
            <img src="/arrow-left.svg" alt="Voltar" />
          </button>
        </Link>
        <Image
          width={700}
          height={160}
          src={episodes.thumbnail}
          objectFit="cover"
        />
        <button type="button" onClick={() => play(episodes)}>
          <img src="/play.svg" alt="Tocar episódio" />
        </button>
      </div>

      <header>
        <h1>{episodes.title}</h1>
        <span>{episodes.members}</span>
        <span>{episodes.publishedAt}</span>
        <span>{episodes.durationAsString}</span>
      </header>

      <div 
        className={styles.description} 
        dangerouslySetInnerHTML={{ __html: episodes.description }} //converter em html
      />
    </div>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const { data } = await api.get('episodes', {
    params: {
      _limit: 12,
      _sort: 'published_at',
      _order: 'desc'
    }
  })
  const paths = data.map(episode => {
    return {
      params: {
        slug: episode.i
      }
    }
  })

  return {
    paths: [],
    fallback: 'blocking'
  }
}

export const getStaticProps: GetStaticProps = async (context) => {
  const { slug } = context.params;

  const { data } = await api.get(`/episodes/${slug}`)

  //Formatting API return data
  const episodes = {
    id: data.id,
    title: data.title,
    members: data.members,
    publishedAt: format(parseISO(data.published_at), 'd MMM yy', { locale: ptBR }),
    thumbnail: data.thumbnail,
    description: data.description,
    url: data.file.url,
    durationAsString: convertDurationToTimeString(Number(data.file.duration)),
    duration: Number(data.file.duration)
  }

  return {
    props: {
      episodes,
    },
    revalidate: 60 * 60 * 24, //7 day
  }
}