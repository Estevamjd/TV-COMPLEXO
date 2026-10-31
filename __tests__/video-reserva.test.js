import { describe, expect, it } from 'vitest';
import { VIDEO_RESERVA, VIDEO_RESERVA_ID, destaqueDoTopo, idYoutubeDoVideo } from '@/lib/video-reserva';
import { idYoutubeDaUrl } from '@/lib/video-utils';
import { PLAYLIST } from '@/lib/canal24h';

describe('idYoutubeDaUrl', () => {
    it.each([
        ['https://www.youtube.com/watch?v=hTBno4SXUgI', 'hTBno4SXUgI'],
        ['https://youtube.com/watch?feature=share&v=hTBno4SXUgI&t=10', 'hTBno4SXUgI'],
        ['https://m.youtube.com/watch?v=hTBno4SXUgI', 'hTBno4SXUgI'],
        ['https://youtu.be/hTBno4SXUgI?si=abc', 'hTBno4SXUgI'],
        ['https://www.youtube.com/embed/hTBno4SXUgI?rel=0', 'hTBno4SXUgI'],
        ['https://www.youtube-nocookie.com/embed/hTBno4SXUgI', 'hTBno4SXUgI'],
        ['https://www.youtube.com/shorts/hTBno4SXUgI', 'hTBno4SXUgI'],
        ['  https://youtu.be/hTBno4SXUgI  ', 'hTBno4SXUgI'],
    ])('%s → %s', (url, id) => {
        expect(idYoutubeDaUrl(url)).toBe(id);
    });

    it.each([
        'https://www.instagram.com/reel/C1a2b3c4d5e/',
        'https://www.youtube.com/@tvcomplexofc',
        'https://www.youtube.com/watch?v=curto',
        'https://evil.com/watch?v=hTBno4SXUgI',
        'https://youtube.com.evil.com/embed/hTBno4SXUgI',
        'javascript:alert(1)',
        'não é url',
        '',
        null,
        undefined,
    ])('rejeita %s', url => {
        expect(idYoutubeDaUrl(url)).toBeNull();
    });
});

describe('destaqueDoTopo', () => {
    const yt = { titulo: 'YouTube novo', plataforma: 'youtube', external_id: 'abcDEF12345', url_video: null };
    const ytUrl = { titulo: 'YouTube por URL', plataforma: 'youtube', external_id: null, url_video: 'https://youtu.be/zzzZZZ00000' };
    const insta = { titulo: 'Reel', plataforma: 'instagram', external_id: 'C1a2b3c4d5e', url_video: 'https://www.instagram.com/reel/C1a2b3c4d5e/' };

    it('usa o mais recente quando ele é do YouTube (external_id ou URL)', () => {
        expect(destaqueDoTopo([yt, insta])).toEqual({ youtubeId: 'abcDEF12345', titulo: 'YouTube novo' });
        expect(destaqueDoTopo([ytUrl, yt])).toEqual({ youtubeId: 'zzzZZZ00000', titulo: 'YouTube por URL' });
    });

    it('mais recente do Instagram (ou banco vazio): null, o topo cai na reserva', () => {
        expect(destaqueDoTopo([insta, yt])).toBeNull();
        expect(destaqueDoTopo([])).toBeNull();
    });

    it('external_id de 11 caracteres de outra plataforma não vira id do YouTube', () => {
        expect(idYoutubeDoVideo(insta)).toBeNull();
    });
});

describe('VIDEO_RESERVA', () => {
    it('é o vídeo público do @tvcomplexofc e fica fora da playlist/grade do canal 24h', () => {
        expect(VIDEO_RESERVA_ID).toBe('hTBno4SXUgI');
        expect(VIDEO_RESERVA.youtubeId).toBe(VIDEO_RESERVA_ID);
        expect(PLAYLIST.some(v => v.youtubeId === VIDEO_RESERVA_ID)).toBe(false);
        expect(PLAYLIST.every(v => v.placeholder)).toBe(true);
    });
});
