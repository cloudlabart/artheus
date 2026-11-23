/** 로그인 · 초대 링크로 첫 비밀번호 정하기 (/login, /login?invite=코드) */
import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { homeFor, useAuth } from '../contexts/AuthContext';
import { api, ROLE_LABEL } from './api';
import { Btn, ErrorBox, Field, inputCls } from './ui';
import { INSTAGRAM_URL } from '../data/siteLinks';

export function LoginPage() {
  const [params] = useSearchParams();
  const invite = params.get('invite') || '';
  const next = params.get('next') || '';
  const { login, acceptInvite, user } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [inv, setInv] = useState<{ name: string; username: string; role: keyof typeof ROLE_LABEL } | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user && !invite) navigate(next || homeFor(user), { replace: true }); }, [user, invite, next, navigate]);
  useEffect(() => {
    if (!invite) return;
    api(`/auth/invite/${invite}`).then(setInv).catch((e) => setErr(e.message));
  }, [invite]);

  async function submit(e: FormEvent) {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      if (invite) {
        if (password !== password2) throw new Error('두 비밀번호가 달라요.');
        const u = await acceptInvite(invite, password); navigate(homeFor(u), { replace: true });
      } else {
        const u = await login(username.trim(), password); navigate(next || homeFor(u), { replace: true });
      }
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }

  return (
    <section className="max-w-[440px] mx-auto px-5 py-14 sm:py-20 min-h-[70vh]">
      <p className="text-xs font-semibold tracking-[0.16em] text-[#2D5E88] uppercase mb-2">{invite ? 'WELCOME' : 'LOGIN'}</p>
      <h1 className="keep-ko text-[28px] font-bold text-[#132B3F] mb-2">{invite ? '비밀번호 정하기' : '로그인'}</h1>
      <p className="keep-ko text-[15px] text-[#35526B] mb-8">
        {invite ? (inv ? `${inv.name}님, ${ROLE_LABEL[inv.role]} 계정의 비밀번호를 정해 주세요. 아이디는 ${inv.username} 이에요.` : '초대 코드를 확인하는 중…')
          : '수강생과 강사 계정으로 로그인하세요. 계정은 학원에서 만들어 드려요.'}
      </p>
      <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-[#153956]/15 bg-[#FAF8F4] p-6">
        <ErrorBox msg={err} />
        {!invite && <Field label="아이디"><input className={inputCls} value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoCapitalize="none" required /></Field>}
        <Field label={invite ? '새 비밀번호' : '비밀번호'} hint={invite ? '영문과 숫자를 섞어 8자 이상' : undefined}>
          <input className={inputCls} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={invite ? 'new-password' : 'current-password'} required />
        </Field>
        {invite && <Field label="새 비밀번호 확인"><input className={inputCls} type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} autoComplete="new-password" required /></Field>}
        <Btn type="submit" kind="primary" disabled={busy || (!!invite && !inv)}>{busy ? '잠시만요…' : invite ? '비밀번호 정하고 시작하기' : '로그인'}</Btn>
      </form>
      {!invite && (
        <p className="keep-ko mt-6 text-sm text-[#5B7285]">
          계정이 없거나 비밀번호를 잊었다면 학원에 새 초대 링크를 요청하세요. <a className="text-[#2D5E88] underline" href={INSTAGRAM_URL} target="_blank" rel="noopener">인스타그램 DM 문의</a>
        </p>
      )}
    </section>
  );
}
