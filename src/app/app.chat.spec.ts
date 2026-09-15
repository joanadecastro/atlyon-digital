import { ChangeDetectorRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import emailjs from '@emailjs/browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './app';
import { LanguageService } from './i18n/language.service';

vi.mock('@emailjs/browser', () => ({ default: { send: vi.fn() } }));

describe('Chat services', () => {
  let app: App;
  const labels = ['UI/UX Design', 'Front-end Development', 'Websites', 'Branding', 'Produtos SaaS'];

  beforeEach(() => {
    vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(0);
    app = TestBed.runInInjectionContext(() => new App(
      { markForCheck: vi.fn() } as unknown as ChangeDetectorRef,
      {} as LanguageService,
    ));
  });

  afterEach(() => vi.restoreAllMocks());

  it('offers all five services under the existing introduction', () => {
    app.handleProjectChatAction('services');
    const message = app.projectChatMessages.at(-1)!;
    expect(message.sender).toBe('assistant');
    expect(message.text).toBe('Trabalho em UI/UX Design, Front-end Development, Branding, Websites e produtos SaaS.');
    expect(message.actions?.map(action => action.label)).toEqual(labels);
    expect(app.projectChatStep).toBe(0);
  });

  it.each(labels)('responds to %s with a description and working action destinations', label => {
    app.handleProjectChatAction('services');
    const option = app.projectChatMessages.at(-1)!.actions!.find(action => action.label === label)!;
    app.handleProjectChatAction(option.action);
    expect(app.projectChatMessages.at(-2)).toMatchObject({ sender: 'user', text: label });
    const response = app.projectChatMessages.at(-1)!;
    expect(response.sender).toBe('assistant');
    expect(response.text.length).toBeGreaterThan(40);
    expect(response.intro).toBeUndefined();
    expect(response.actions).toEqual([
      { id: 'service-projects', label: 'Ver projetos', action: 'service-projects' },
      { id: 'service-quote', label: 'Pedir orçamento', action: 'quote' },
      { id: 'service-contact', label: 'Contactar', action: 'other', href: 'mailto:joanacastro.webdeveloper@gmail.com' },
    ]);
    expect(app.projectChatStep).toBe(0);
    app.handleProjectChatAction(response.actions![1].action);
    expect(app.projectChatStep).toBe(1);
    expect(app.projectChatMessages.at(-1)).toMatchObject({ sender: 'user', text: 'Quero um orçamento' });
  });

  it.each([null, { route: '/case-studies/civitas' }])('reuses section navigation for projects from %j', project => {
    app.selectedProject = project;
    const navigate = vi.spyOn(app, 'navigateToSection').mockImplementation(() => {});
    const close = vi.spyOn(app, 'closeProjectChat').mockImplementation(() => {});
    app.handleProjectChatAction('service-projects');
    expect(close).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith(expect.any(Event), 'portfolio');
  });
});

describe('Chat request delivery', () => {
  let app: App;
  const send = vi.mocked(emailjs.send);

  beforeEach(() => {
    send.mockReset();
    app = TestBed.runInInjectionContext(() => new App(
      { markForCheck: vi.fn() } as unknown as ChangeDetectorRef,
      {} as LanguageService,
    ));
    app.projectChatStep = 5;
    app.projectChat = {
      name: 'Ana Silva', email: 'ana@example.com', type: 'Website',
      goal: 'Criar um portfolio', budget: 'Até 750 €',
    };
  });

  it.each(['name', 'email', 'type', 'goal', 'budget'] as const)(
    'does not send with an empty %s', async (field) => {
      app.projectChat[field] = ' ';
      await app.submitProjectChat();
      expect(send).not.toHaveBeenCalled();
      expect(app.projectChatSent).toBe(false);
      expect(app.projectChatError).not.toBe('');
    },
  );

  it('includes each selected budget option in the EmailJS message', async () => {
    for (const budget of app.projectBudgetOptions) {
      app.projectChatSent = false;
      app.chooseProjectBudget(budget);
      send.mockResolvedValueOnce({ status: 200, text: 'OK' });
      await app.submitProjectChat();
      expect(app.projectChat.budget).toBe(budget);
      expect(send.mock.lastCall?.[2]?.['message']).toContain(`Orçamento: ${budget}\n`);
    }
  });

  it('rejects an invalid email', async () => {
    app.projectChat.email = 'invalid';
    await app.submitProjectChat();
    expect(send).not.toHaveBeenCalled();
  });

  it('waits for delivery, maps template fields and prevents duplicate sends', async () => {
    let resolve!: (value: { status: number; text: string }) => void;
    send.mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
    const pending = app.submitProjectChat();
    expect(app.projectChatSending).toBe(true);
    expect(app.projectChatSent).toBe(false);
    await app.submitProjectChat();
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith('service_jr984oj', 'template_7zyvxhl', {
      name: 'Ana Silva', email: 'ana@example.com', service: 'Website',
      reply_to: app.projectChat.email,
      company: 'Não indicado', phone: 'Não indicado',
      message: `Objetivo: Criar um portfolio\nOrçamento: Até 750 €\nPágina: ${window.location.href}`,
    }, { publicKey: expect.any(String) });
    resolve({ status: 200, text: 'OK' });
    await pending;
    expect(app.projectChatSent).toBe(true);
    expect(app.projectChatSending).toBe(false);
    await app.submitProjectChat();
    expect(send).toHaveBeenCalledTimes(1);
  });

  it.each(['visitor@example.com', 'another.visitor@example.org'])(
    'uses the visitor email %s as reply_to', async (email) => {
      app.projectChat.email = email;
      send.mockResolvedValueOnce({ status: 200, text: 'OK' });
      await app.submitProjectChat();
      expect(send.mock.calls[0][2]?.['reply_to']).toBe(app.projectChat.email);
    },
  );

  it('preserves the request after an error and permits retry', async () => {
    send.mockRejectedValueOnce(new Error('Network unavailable'));
    const request = { ...app.projectChat };
    await app.submitProjectChat();
    expect(app.projectChatSent).toBe(false);
    expect(app.projectChatSending).toBe(false);
    expect(app.projectChat).toEqual(request);
    expect(app.projectChatError).toBe('Não foi possível enviar o pedido. Tenta novamente ou contacta-me por email.');
    send.mockResolvedValueOnce({ status: 200, text: 'OK' });
    await app.submitProjectChat();
    expect(app.projectChatSent).toBe(true);
    expect(app.projectChatError).toBe('');
  });

  it('does not mark a new conversation as sent when an older request finishes', async () => {
    let resolve!: (value: { status: number; text: string }) => void;
    send.mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
    const pending = app.submitProjectChat();
    app.projectChat = { name: '', email: '', type: '', goal: '', budget: '' };
    resolve({ status: 200, text: 'OK' });
    await pending;
    expect(app.projectChatSent).toBe(false);
    expect(app.projectChatSending).toBe(false);
  });
});
